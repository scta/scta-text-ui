
def get_data(url)
  begin
    file = open("#{url}?access_token=#{cookies[:GITHUB_ACCESS_TOKEN]}").read
  rescue OpenURI::HTTPError
    data = false
  else
    data = JSON.parse(file)
  end
  return data
end

def get_doc(data)
  content = Base64.decode64(data["content"])
  doc = Nokogiri::XML(content).to_xml(:encoding => 'UTF-8')
  return doc
end

def get_doc_from_data(url)
  data = get_data(url)
  doc = get_doc(data)
  return doc
end
