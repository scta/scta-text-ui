require 'sinatra'
require 'octokit'
require 'gon-sinatra'
require 'open-uri'
require 'json'
require "base64"
require "net/https"
require "nokogiri"
require "sinatra/cookies"
require "httparty"
require "lbp"
require 'cgi'

require_relative "lib/pr_functions"
require_relative "lib/get_functions"

CLIENT_ID = ENV['CLIENT_ID']
CLIENT_SECRET = ENV['CLIENT_SECRET']

use Rack::Session::Pool
Sinatra::register Gon::Sinatra

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

# authentation code taken from https://developer.github.com/v3/guides/basics-of-authentication/ and http://radek.io/2014/08/03/github-oauth-with-octokit/
def authenticated?
  session[:access_token]
end

def authenticate!
  client = Octokit::Client.new
  scopes = ['repo', 'user']
  url = client.authorize_url(CLIENT_ID, :scope => 'repo,user:email')

  redirect url
end

# index route
get '/' do
  if !authenticated?
    authenticate!
  else
    access_token = session[:access_token]
    scopes = []

    client = Octokit::Client.new \
      :client_id => CLIENT_ID,
      :client_secret => CLIENT_SECRET

    begin
      client.check_application_authorization access_token
    rescue => e
      # request didn't succeed because the token was revoked so we
      # invalidate the token stored in the session and render the
      # index page so that the user can start the OAuth flow again

      session[:access_token] = nil
      return authenticate!
    end

    # doesn't necessarily need to go in 'editor'
    redirect '/editor'
  end
end

# step two in the oauth process
# github redirects here
# if auth_token is not already set, auth_token and other desirable data are set to environmental variables
get '/return' do
  # get code return from github and get access token
  session_code = request.env['rack.request.query_hash']['code']
  result = Octokit.exchange_code_for_token(session_code, CLIENT_ID, CLIENT_SECRET)
  session[:access_token] = result[:access_token]

  #erb :load
  redirect '/'
end

# STEP 3 return user to main edit page
# main edit page
get '/editor' do
  # get api url for target file
  #url = params[:url]
  # get cookie data need for view
  client = Octokit::Client.new :access_token => session[:access_token]
  data = client.user
  @username = data.login
  @user_url = data.html_url
  gon.access_token = session[:access_token]
  gon.username = @username
  gon.name = data.name
  if data.email
    gon.email = data.email
  else
    gon.email = @username + '@users.noreply.github.com'
  end

  erb :editor
end

## just returns parsed doc
## required for ajax reques
# this could likely be done entirely in javascript
get '/doc' do
  # get api url for target file
  url = params[:url]
  # get cookie data need for view
  client = Octokit::Client.new :access_token => session[:access_token]
  data = client.user
  @username = data.login
  @user_url = data.html_url

  # get doc from github
  if url
    @doc = get_doc_from_data(url)
  else
    @doc = get_doc_from_template
  end
  return @doc
end
