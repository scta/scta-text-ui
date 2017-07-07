$(document).ready(function(){
  // load empty template onload
  loadTemplateText()
  //load empty template
  $(document).on("click","#file-new", function(){
    console.log("test")
    loadTemplateText()
  });
//open dir
  $(document).on("click","#file-open-dir", function(){
    $('#save').css({"display": "none"})
    $('#dir').css({"display": "block"})
    var url = "https://api.github.com/user/repos"
    retrieveAPIData(url, gon.access_token).done(function(data){
      for (var i = 0, len = data.length; i < len; i++) {
        $("#repositories").append('<li><a class="file-open-file" data-url="'+ data[i].url + '">' + data[i].url +'</a></li>');
      }
    });
  });
  $(document).on("click","#file-open-save", function(){
    $('#dir').css({"display": "none"});
    $('#save').css({"display": "block"});
  });
//open file from dir
  $(document).on("click",".file-open-file", function(){
    var url = $(this).attr("data-url");
    $('#dir').css({"display": "none"})
    loadText(url, gon.access_token)
  });
// open file from input url
  $("#file-manual").submit(function(e){
    e.preventDefault();
    $('#dir').css({"display": "none"})
    var url = $(this).find("#manual-url").val();
    loadText(url, gon.access_token)

  });

// save file using save form data-xmlns
$("#save-form").submit(function(e){
  e.preventDefault();
  var textContent = $("#editor-text-area").val();
  var content = Base64.encode(textContent);

  //var content = btoa($("#editor-text-area").text());
  var url = $(this).find("#save-url").val();
  var branch = $(this).find("#branch").val();
  var sha = $(this).find("#sha").val();
  var message = $(this).find("#message").val();
  var commiterName = gon.name;
  var commiterEmail = gon.email;

  var commit_data = {
    "path": url,
    "message": message,
    "committer": {
      "name": commiterName,
      "email": commiterEmail
      },
    "content": content,
    "sha": sha,
    "branch": branch
    }

    //update content
    //TODO: move this to separate function
    url_with_access = url.includes("?") ? url + "&access_token=" + gon.access_token : url + "?access_token=" + gon.access_token
    $.ajax({
      url: url_with_access, // your api url
      type: 'put', // type is any HTTP method
      contentType: "application/json",
      //JSON.stringify seems required; it's the only way I could get it to work
      data: JSON.stringify(commit_data),

      success: function(data, status, res) {
        console.log(res.responseJSON.content)
        //updates save parameters; specifically it resets save form with newest shaw
        setSaveParameters(res.responseJSON.content)
        $('#save').css({"display": "none"});
      },
      error: function(res, status, error){
        console.log(res, status, error)
      }
    });
  });

});


// Utility functions

function retrieveAPIData(url, access_token){
  url_with_access = url.includes("?") ? url + "&access_token=" + access_token : url + "?access_token=" + access_token;
  return $.get(url_with_access);
}

function parseXMLContent(data){
  var content = Base64.decode(data.content);
  return content;

}
function addXMLContent(content){
  $("#editor-text-area").val(content);
}
function createPreviewContent(){
  var newText = tei_conversion($("#editor-text-area").val(), function(data){});
  $("#preview").html(newText);
}

function setSaveParameters(data){
  var sha = data.sha
  var url = data.url.split("?ref=")[0]
  var branch = data.url.split("?ref=")[1]
  $("#sha").attr("value", sha );
  $("#save-url").attr("value", url);
  $("#branch").attr("value", branch );

}

function loadText(url, access_token){
  retrieveAPIData(url, access_token).done(function(data){
    var content = parseXMLContent(data);
    addXMLContent(content);
    createPreviewContent();
    setSaveParameters(data);
  });
}
// TODO: this function still relies on a sinatra route, but should be any easy fix.
function loadTemplateText(){
  $.get("/doc", function(data){
    $("#editor-text-area").val(data);
    var newText = tei_conversion($("#editor-text-area").val(), function(data){});
    $("#preview").html(newText);
  });
}

// note: after a file is saved, if you immediately navigate away and then come back to that file
//github is sometimes still serviing the file, because it hasn't updated yet.
//This could cause some real headaches for users.
