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

get '/' do

end

# get '/new' do
#   erb :new
# end
#
# post '/create' do
#   id = @params[:id]
#   title = @params[:title]
#   type = @params[:type]
#
#   data = {
#     "@context": "http://scta.info/api/core/1.0/people/context.json",
#     "@id": "http://scta.info/resource/#{id}",
#     "@type": "http://scta.info/resource/person",
#     "dc:title": "#{title}",
#     "sctap:personType": "http://scta.info/resource/#{type}",
#     "sctap:shortId": "#{id}"
#   }
#
#   content = Base64.encode64(JSON.pretty_generate(data))
#
#   wrapper =
#   {
#   "message": "New entry for #{id}",
#   "committer": {
#     "name": "Jeffrey C. Witt",
#     "email": "jeffreycwitt@gmail.com"
#   },
#   "content": content,
#   "branch": "develop"
#   }
#   wrapped_content = JSON.pretty_generate(wrapper)
#
#   uri = URI.parse("https://api.github.com/repos/scta/scta-people/contents/graphs/#{id}.jsonld")
#   http = Net::HTTP.new(uri.host, uri.port)
#   http.use_ssl = true
# 	req = Net::HTTP::Put.new(uri.request_uri, 'Content-Type' => 'application/json')
#   req.basic_auth("jeffreycwitt", ENV['GITHUB_AUTH_TOKEN'])
# 	req.body = wrapped_content
#   @res = http.request(req)
#
#   ## begin pull request
#   submit_pr(id)
#   erb :created
# end

post '/update' do

  text = @params[:text]
  sha = @params[:sha]
  doc = Nokogiri::XML(text).to_xml(:encoding => 'UTF-8')
  content = Base64.encode64(doc)

  repo_name = @params[:reponame]
  item = @params[:resourceid]
  repo_base = "https://api.github.com/repos/scta-texts/"
  filename = "#{item}.xml"
  url = "#{repo_base}#{repo_name}/contents/#{item}/#{filename}"

  wrapper =
  {
  "message": "Update for #{item}",
  "committer": {
    "name": "Jeffrey C. Witt",
    "email": "jeffreycwitt@gmail.com"
  },
  "content": content,
  "sha": sha,
  "branch": "student-work"
  }
  wrapped_content = JSON.pretty_generate(wrapper)

  @res = HTTParty.put(url, body: wrapped_content, headers: {'Content-Type' => 'application/json', "Authorization" => "token #{cookies["GITHUB_ACCESS_TOKEN"]}", 'User-Agent' => "scta-text-ui-develop"})




  ## begin pull request
  pull_url = "https://api.github.com/repos/scta-texts/#{repo_name}/pulls?access_token=#{cookies[:GITHUB_ACCESS_TOKEN]}"
  submit_pr(pull_url)

  erb :updated



end
get '/return' do
  code = @params[:code]
  #POST https://github.com/login/oauth/access_token with code received from step 1

  uri = URI.parse("https://github.com/login/oauth/access_token")
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  req = Net::HTTP::Post.new(uri.request_uri, initheader = {"Accept" => 'application/json'})
  req.set_form_data({"code" => code, "client_id" => ENV['CLIENT_ID'], "client_secret" => ENV['CLIENT_SECRET']})

  @res = http.request(req)
  access_token = JSON.parse(@res.body)["access_token"]
  cookies[:GITHUB_ACCESS_TOKEN] = access_token
  redirect "/edit?resourceid=ahsh-l1p1i1t1q1c1&branch=student-work"
end
get '/login' do
  # step 1
  #scope is necessary for allow write permissions
  redirect "https://github.com/login/oauth/authorize?client_id=#{ENV['CLIENT_ID']}&scope=repo"
end
get '/edit' do

  @edit_branch_title = if params[:branch] then params[:branch] else "master" end

  #repo_name = @params[:reponame]
  item = @params[:resourceid]
  resource = Lbp::Resource.find(item)
  if resource.is_a? Lbp::Expression or resource.is_a? Lbp::Manifestation
    transcription = resource.canonical_transcription.resource
  elsif resource.is_a? Lbp::Transcription
    transcription = resource
  end

  repo_array = transcription.doc_path.split("https://").last.split("/")
  owner = repo_array[1]
  repo = repo_array[2]
  relative_path = transcription.doc_path.split("/raw/master/").last
  repo_base = "https://api.github.com/repos"
  url = "#{repo_base}/#{owner}/#{repo}/contents/#{relative_path}"




  begin
    file = open("#{url}?access_token=#{cookies[:GITHUB_ACCESS_TOKEN]}").read
  rescue OpenURI::HTTPError
    @data = false
  else
    @data = JSON.parse(file)
    @content = Base64.decode64(@data["content"])
    @doc = Nokogiri::XML(@content).to_xml(:encoding => 'UTF-8')
  end



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
  erb :edit
end
