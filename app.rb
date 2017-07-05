require 'sinatra'
require 'open-uri'
require 'json'
require "base64"
require "net/https"
require "nokogiri"
require "sinatra/cookies"
require "httparty"
require "lbp"

require_relative "lib/pr_functions"
require_relative "lib/get_functions"

configure do
  set :server, :puma
  set :bind, "0.0.0.0"
  set :protection, except: [:frame_options, :json_csrf]
  set :root, File.dirname(__FILE__)

  # this added in attempt to "forbidden" response when clicking on links
  #set :protection, :except => :ip_spoofing
  #set :protection, :except => :json
end

if settings.development?
  require 'pry'
end

# index route
get '/' do
  if cookies[:GITHUB_ACCESS_TOKEN] != nil
    data = JSON.parse(cookies['GITHUB_USER_DATA'])
    @username = data['login']
    @user_url = data['html_url']
  end
  erb :index
end

# login route
# step one in the oauth process
get '/login' do
  #scope is necessary for allow write permissions
  redirect "https://github.com/login/oauth/authorize?client_id=#{ENV['CLIENT_ID']}&scope=repo"
end

# step two in the oauth process
# github redirects here
# if auth_token is not already set, auth_token and other desirable data are set to environmental variables
get '/return' do
  # check to see if acess_token has already been set
  if cookies[:GITHUB_ACCESS_TOKEN] == nil
    #get code return from github
    code = @params[:code]
    #request access_token using returned code and client_id and client_secret
    uri = URI.parse("https://github.com/login/oauth/access_token")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    req = Net::HTTP::Post.new(uri.request_uri, initheader = {"Accept" => 'application/json'})
    req.set_form_data({"code" => code, "client_id" => ENV['CLIENT_ID'], "client_secret" => ENV['CLIENT_SECRET']})
    @res = http.request(req)
    #parse response
    access_token = JSON.parse(@res.body)["access_token"]
    cookies[:GITHUB_ACCESS_TOKEN] = access_token
    #get user data using new access token
    user_data_raw = open("https://api.github.com/user?access_token=#{access_token}").read
    cookies[:GITHUB_USER_DATA] = user_data_raw
  end

  data = JSON.parse(cookies['GITHUB_USER_DATA'])
  @username = data['login']
  @user_url = data['html_url']
  erb :load
end

# update (aka commit a file)
# TODO: make this more generic; most of this is custom for scta texts and repos
# TODO: abstract some of this out to lib directory
post '/update' do

  text = @params[:text]
  sha = @params[:sha]
  doc = Nokogiri::XML(text).to_xml(:encoding => 'UTF-8')
  content = Base64.encode64(doc)

  owner = @params[:owner]
  repo_name = @params[:reponame]
  item = @params[:resourceid]
  repo_base = "https://api.github.com/repos"
  filename = "#{item}.xml"
  url = "#{repo_base}/#{owner}/#{repo_name}/contents/#{item}/#{filename}"
  branch = @params[:branch]

  wrapper =
  {
  "message": "Update for #{item}",
  "committer": {
    "name": "Jeffrey C. Witt",
    "email": "jeffreycwitt@gmail.com"
  },
  "content": content,
  "sha": sha,
  "branch": branch
  }
  wrapped_content = JSON.pretty_generate(wrapper)

  # create git commit via github api
  @res = HTTParty.put(url, body: wrapped_content, headers: {'Content-Type' => 'application/json', "Authorization" => "token #{cookies["GITHUB_ACCESS_TOKEN"]}", 'User-Agent' => "scta-text-ui-develop"})

  ## begin pull request
  pull_url = "#{repo_base}/#{owner}/#{repo_name}/pulls?access_token=#{cookies[:GITHUB_ACCESS_TOKEN]}"
  submit_pr(pull_url, branch)

  # load new view
  erb :updated
end

# main edit page
get '/editor' do
  # get api url for target file
  url = params[:url]
  # get cookie data need for view
  data = JSON.parse(cookies['GITHUB_USER_DATA'])
  @username = data['login']
  @user_url = data['html_url']

  # get doc from github
  # if url
  #   @data = get_data(url)
  #   @doc = get_doc(@data)
  # else
  #   @data = {}
  #   @doc = get_doc_from_template
  # end
  @access_token = cookies[:GITHUB_ACCESS_TOKEN]
  erb :editor
end

## just returns parsed doc
## required for ajax reques
# this could likely be done entirely in javascript
get '/doc' do
  # get api url for target file
  url = params[:url]
  # get cookie data need for view
  data = JSON.parse(cookies['GITHUB_USER_DATA'])
  @username = data['login']
  @user_url = data['html_url']

  # get doc from github
  if url
    @doc = get_doc_from_data(url)
  else
    @doc = get_doc_from_template
  end
  return @doc
end
get '/data' do
  content_type :json
  url = params[:url]
  data = get_data(url)
  @data = data.to_json
end
# alternative edit page
# route for edit view with embeded mirador
# a lot of this is customized to retrieve github file name from scta text id
# probably best to depreciate this route but preserve it as an example for new route
get '/edit' do

  @edit_branch_title = if params[:branch] then params[:branch] else "master" end

  # get iiif collection url
  # get transcription object from scta database
  item = @params[:resourceid]
  resource = Lbp::Resource.find(item)
  if resource.is_a? Lbp::Expression
    transcription = resource.canonical_transcription.resource
    @iiif_url = "http://scta.info/iiif/#{resource.top_level_expression.short_id}/collection"
  elsif resource.is_a? Lbp::Manifestation
    transcription = resource.canonical_transcription.resource
    @iiif_url = "http://scta.info/iiif/#{item}/collection"
  elsif resource.is_a? Lbp::Transcription
    transcription = resource
    @iiif_url = "http://scta.info/iiif/#{item}/collection"
  end


  collection_url = "http://scta.info/iiif/"

  repo_array = transcription.doc_path.split("https://").last.split("/")
  @owner = repo_array[1]
  @repo = repo_array[2]
  relative_path = transcription.doc_path.split("/raw/master/").last
  repo_base = "https://api.github.com/repos"
  url = "#{repo_base}/#{@owner}/#{@repo}/contents/#{relative_path}"



  # TODO: replace with functions used in lib/get_functions.rb
  begin
    file = open("#{url}?access_token=#{cookies[:GITHUB_ACCESS_TOKEN]}").read
  rescue OpenURI::HTTPError
    @data = false
  else
    @data = JSON.parse(file)
    @content = Base64.decode64(@data["content"])
    @doc = Nokogiri::XML(@content).to_xml(:encoding => 'UTF-8')
  end


  #TODO: this is sort of depreciated, since I'm no longer using two desplays of text
  branch_file = open("#{url}?ref=#{@edit_branch_title}&access_token=#{cookies[:GITHUB_ACCESS_TOKEN]}").read

  @branch_data = JSON.parse(branch_file)
  @branch_content = Base64.decode64(@branch_data["content"])
  @branch_doc = Nokogiri::XML(@branch_content).to_xml(:encoding => 'UTF-8')

  @edit_branch_doc =
  if params[:branch] == "master" || params[:branch].nil? then
    if @data != false
      @doc
    else
      @branch_doc
    end
  else
    @branch_doc
  end

  erb :edit, :layout => false
end
