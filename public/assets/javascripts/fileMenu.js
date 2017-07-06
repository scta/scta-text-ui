$(document).ready(function(){
  var access_token = $("#aldfjds").text();
  // load empty template onload
  loadTemplateText()
  //load empty template
  $(document).on("click","#file-new", function(){
    console.log("test")
    loadTemplateText()
  });


//===============BINDING ENVENTS =========================//
//open dir
  $(document).on("click",".file-open-dir", function(){
    $('#save').css({"display": "none"})
    $('#repo-browser').css({"display": "none"})
    $('#breadcrumbs').empty();
    $("#repositories").empty();
    $('#dir').css({"display": "block"})
    var url = "https://api.github.com/user/repos"
    displayRepoList(url, access_token);
  });
//open save dialogue box
  $(document).on("click","#file-open-save", function(){
    $('#dir').css({"display": "none"});
    $('#repo-browser').css({"display": "none"});
    $('#save').css({"display": "block"});
  });

// open file events
  //open file from direct url list
  $(document).on("click",".file-open-file", function(){
    var url = $(this).attr("data-url");
    $('.file-window').css({"display": "none"})
    loadText(url, access_token)
  });
// open file from input url
  $("#file-manual").submit(function(e){
    e.preventDefault();
    $('#dir').css({"display": "none"})
    var url = $(this).find("#manual-url").val();
    loadText(url, access_token)
  });
  //open file from directory list
  $(document).on("click",".file-open-file-list", function(){
    var path = $(this).attr("data-path");
    var branch = $(this).attr("data-branch");
    var branchSha = $(this).attr("data-branch");
    var repo = $(this).attr("data-repo");
    var url = "https://api.github.com/repos/" + repo + "/contents" + path;
    $('.file-window').css({"display": "none"})
    loadText(url, access_token)
  });
//directory or repo opening events
  //open respository from branch and display top level tree contents
  $(document).on("click", ".file-open-branch", function(){
    var url = $(this).attr("data-url");
    var branch = $(this).attr("data-branch");
    var branchSha = $(this).attr("data-branch-sha");
    //retrieveDirectoryCommits(url, access_token)
    retrieveRepoTree(url, access_token, branch, branchSha);
  // select repo and liste available branches
  });
  $(document).on("click", ".file-open-repo", function(){
    var url = $(this).attr("data-url");
    var branch = $(this).attr("data-branch");
    getRepoBranches(url, access_token);
  });
  //display contents of a git tree
  $(document).on("click",".file-open-tree", function(){
    var url = $(this).attr("data-url");
    var path = $(this).attr("data-path");
    var branch = $(this).attr("data-branch");
    var branchSha = $(this).attr("data-branch-sha");
    var repo = $(this).attr("data-repo");
    retrieveTreeTree(url, access_token, path, branch, branchSha, repo);
  });

/// FUNCTIONS

// ===========Save Functions =================

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
        console.log(res.responseJSON.content)
        //updates save parameters; specifically it resets save form with newest shaw
        setSaveParameters(res.responseJSON.content)
        $('#message').empty();
        $('#save').css({"display": "none"});
      },
      error: function(res, status, error){
        console.log(res, status, error)
      }
    });
  });

});

//=============DIRECTORY BROWSER FUNCTIONS =================
function retrieveDirectoryCommits(repo_base, access_token, branch){
  console.log("TEST")
  //set branch default to "master"
  branch = (typeof branch !== 'undefined') ?  branch : "master";

  var url = repo_base + "/commits/" + branch;
  var url_with_access = url.includes("?") ? url + "&access_token=" + access_token : url + "?access_token=" + access_token;
  $.ajax({
    url: url_with_access, // your api url
    type: 'get', // type is any HTTP method
    contentType: "application/json",
    //JSON.stringify seems required; it's the only way I could get it to work
    success: function(data, status, res) {
      console.log("direcet directory commits", res)
      //updates save parameters; specifically it resets save form with newest shaw


    },
    error: function(res, status, error){
      console.log(res, status, error)
    }
  });
}
function getRepoBranches(repo_base, access_token){
  var url = repo_base + "/branches";
  retrieveAPIData(url, access_token).done(function(data){
    console.log(data);
    displayRepoBranches(data, repo_base);
  });
}
function displayRepoBranches(data, repo_base){
  $("#repo-browser-list").empty();
  $("#repo-browser").css({"display": "block"});
  $("#repo-browser-list").append('<h1>Available Branches</h1>');
  //$("#repo-browser-list").append('<p><a class="file-open-dir">' + "Back to Repo List" +'</a></li>');
  for (var i = 0, len = data.length; i < len; i++) {
    $("#repo-browser-list").append('<li><a class="file-open-branch" data-branch-sha="' + data[i].commit.sha + '" data-url="'+ repo_base + '" data-branch="' + data[i].name + '">' + data[i].name +'</a></li>');
  }
}
function retrieveRepoTree(repo_base, access_token, branch, branchSha){
  //set branch default to "master"
  var repo = repo_base.split("https://api.github.com/repos/")[1];
  branch = (typeof branch !== 'undefined') ?  branch : "master";
  var url = repo_base + "/git/trees/" + branch;
  var url_with_access = url.includes("?") ? url + "&access_token=" + access_token : url + "?access_token=" + access_token;
  $.ajax({
    url: url_with_access, // your api url
    type: 'get', // type is any HTTP method
    contentType: "application/json",
    success: function(data, status, res) {
      console.log("direcet directory commits", res)
      displayTree(res.responseJSON.tree, "", branch, branchSha, repo);
      //updates save parameters; specifically it resets save form with newest shaw


    },
    error: function(res, status, error){
      console.log(res, status, error)
    }
  });

}

function retrieveTreeTree(tree_url, access_token, parent_path, branch, branchSha, repo){
  retrieveAPIData(tree_url, access_token).done(function(data){

    displayTree(data.tree, parent_path, branch, branchSha, repo, tree_url);

  });


}
function displayRepoList(url, access_token){
  retrieveAPIData(url, access_token).done(function(data){
    console.log("repo data", data);
    $("#repo-browser-branch").empty();
    for (var i = 0, len = data.length; i < len; i++) {
      $("#repositories").append('<li><a class="file-open-repo" data-url="'+ data[i].url + '">' + data[i].url +'</a></li>');
    }
  });
}

function displayTree(tree, path, branch, branchSha, repo, parent_tree_url){

  $("#repo-browser-list").empty();
  $("#repo-browser-branch").empty();
  $("#repo-browser").css({"display": "block"});
  $("#repo-browser-branch").html('<p>' + branch + '</p>');

  if (path){
    //bug, this keeps appending even when you are moving back up the tree
    $("#breadcrumbs").append(' / <a class="file-open-tree" data-repo="' + repo + '" data-branch="' + branch + '" data-branch-sha="' + branchSha + '" data-url="'+ parent_tree_url + '" data-path="' + path + '">' + path.split("/").pop() +'</a>');
  }
  for (var i = 0, len = tree.length; i < len; i++) {
    if (tree[i].type === 'blob' && tree[i].path.includes('.xml')){
      $("#repo-browser-list").append('<li><a class="file-open-file-list" data-repo="' + repo + '" data-branch="' + branch + '" data-branch-sha="' + branchSha + '" data-url="'+ tree[i].url + '" data-path="' + path + "/" + tree[i].path + '">' + tree[i].path +'</a></li>');
    }
    else if (tree[i].type === 'blob' && !tree[i].path.includes('.xml')){
      $("#repo-browser-list").append('<li style="color: gray">' + tree[i].path +'</li>');
    }
    else if (tree[i].type === 'tree'){
      $("#repo-browser-list").append('<li><a class="file-open-tree" data-repo="' + repo + '" data-branch="' + branch + '" data-branch-sha="' + branchSha + '" data-url="'+ tree[i].url + '" data-path="' + path + "/" + tree[i].path + '">' + tree[i].path +'</a></li>');
    }
  }
}

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
  var branch = data.url.split("?ref=")[1] ? data.url.split("?ref=")[1] : state["branch"];
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
