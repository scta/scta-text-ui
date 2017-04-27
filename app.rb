require 'sinatra'
require 'open-uri'
require 'json'
require "base64"
require "net/https"
require "nokogiri"

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

get '/new' do
  erb :new
end

post '/create' do
  id = @params[:id]
  title = @params[:title]
  type = @params[:type]

  data = {
    "@context": "http://scta.info/api/core/1.0/people/context.json",
    "@id": "http://scta.info/resource/#{id}",
    "@type": "http://scta.info/resource/person",
    "dc:title": "#{title}",
    "sctap:personType": "http://scta.info/resource/#{type}",
    "sctap:shortId": "#{id}"
  }

  content = Base64.encode64(JSON.pretty_generate(data))

  wrapper =
  {
  "message": "New entry for #{id}",
  "committer": {
    "name": "Jeffrey C. Witt",
    "email": "jeffreycwitt@gmail.com"
  },
  "content": content,
  "branch": "develop"
  }
  wrapped_content = JSON.pretty_generate(wrapper)

  uri = URI.parse("https://api.github.com/repos/scta/scta-people/contents/graphs/#{id}.jsonld")
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
	req = Net::HTTP::Put.new(uri.request_uri, 'Content-Type' => 'application/json')
  req.basic_auth("jeffreycwitt", ENV['GITHUB_AUTH_TOKEN'])
	req.body = wrapped_content
  @res = http.request(req)

  ## begin pull request
  submit_pr(id)
  erb :created
end

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



  uri = URI.parse(url)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
	req = Net::HTTP::Put.new(uri.request_uri, 'Content-Type' => 'application/json')
  req.basic_auth("jeffreycwitt", ENV['GITHUB_AUTH_TOKEN'])
	req.body = wrapped_content
  @res = http.request(req)

  ## begin pull request
  pull_url = "https://api.github.com/repos/scta-texts/#{repo_name}/pulls"
  submit_pr(pull_url)

  erb :updated



end
get '/edit' do
  @edit_branch_title = if params[:branch] then params[:branch] else "master" end

  repo_name = @params[:reponame]
  item = @params[:resourceid]
  repo_base = "https://api.github.com/repos/scta-texts"
  filename = "#{item}.xml"
  url = "#{repo_base}/#{repo_name}/contents/#{item}/#{filename}"



  begin
    file = open("#{url}", http_basic_authentication: ["jeffreycwitt", ENV['GITHUB_AUTH_TOKEN']]).read
  rescue OpenURI::HTTPError
    @data = false
  else
    @data = JSON.parse(file)
    @content = Base64.decode64(@data["content"])
    @doc = Nokogiri::XML(@content).to_xml(:encoding => 'UTF-8')
  end



  branch_file = open("#{url}?ref=student-work", http_basic_authentication: ["jeffreycwitt", ENV['GITHUB_AUTH_TOKEN']]).read
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
