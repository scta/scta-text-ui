$(document).ready(function(){
  var access_token = $("#aldfjds").text();

  //var newText = tei_conversion($("#editor-text-area").val(), function(data){});
  //$("#preview").html(newText);
//create new file
  $(document).on("click","#file-new", function(){
    console.log("test")
    $.get("/doc", function(data){
      $("#editor-text-area").val(data);
      var newText = tei_conversion($("#editor-text-area").val(), function(data){});
      $("#preview").html(newText);
    });
  });
//open dir
  $(document).on("click","#file-open-dir", function(){
    $('#save').css({"display": "none"})
    $('#dir').css({"display": "block"})
    var url = "https://api.github.com/user/repos"
    retrieveAPIData(url, access_token).done(function(data){
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
    retrieveAPIData(url, access_token).done(function(data){
      var content = parseXMLContent(data);
      addXMLContent(content);
      createPreviewContent();
      setSaveParameters(data);
    });
  });
// open file from input url
  $("#file-manual").submit(function(e){
    e.preventDefault();
    $('#dir').css({"display": "none"})

    var url = $(this).find("#manual-url").val();
    retrieveAPIData(url, access_token).done(function(data){
      var content = parseXMLContent(data);

      addXMLContent(content);
      createPreviewContent();
      setSaveParameters(data);
    });
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
  var commiterName = "Jeffrey C. Witt"
  var commiterEmail = "jeffreycwitt@gmail.com"

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
    url_with_access = url.includes("?") ? url + "&access_token=" + access_token : url + "?access_token=" + access_token
    $.ajax({
      url: url_with_access, // your api url
      type: 'put', // type is any HTTP method
      contentType: "application/json",
      //JSON.stringify seems required; it's the only way I could get it to work
      data: JSON.stringify(commit_data),

      success: function(data, status, res) {
        console.log(data, status, res)
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
  //note jquery.html is expanding self closed xml tags
  // innerHTML does not seem to be causing this problem
  $("#editor-text-area").val(content);
  //document.getElementById("editor-text-area").innerHTML = content;
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
