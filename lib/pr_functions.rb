def submit_pr(url)
  pr = {
  "title": "Pull request for updated entry",
  "body": "Please pull this in!",
  "head": "develop",
  "base": "master"
  }
  pr = JSON.pretty_generate(pr)

  pr_uri = URI.parse(url)
  pr_http = Net::HTTP.new(pr_uri.host, pr_uri.port)
  pr_http.use_ssl = true
	pr_req = Net::HTTP::Post.new(pr_uri.request_uri, 'Content-Type' => 'application/json')
  pr_req.basic_auth("jeffreycwitt", ENV['GITHUB_AUTH_TOKEN'])
	pr_req.body = pr
  @pr_res = pr_http.request(pr_req)
end
