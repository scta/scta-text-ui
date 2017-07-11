var aceEditor;

$(document).ready(function(){
  aceEditor = ace.edit("editor");
  aceEditor.setTheme("ace/theme/kuroir");
  aceEditor.session.setMode("ace/mode/xml");

  // load empty template onload
  loadTemplateText();

  aceEditor.on('change', function() {
    var newText = tei_conversion(aceEditor.getValue(), function(data){
    });
    //console.log(newText);
    $("#preview").html(newText);
  });

  //load empty template
  $(document).on("click","#file-new", function(){
    loadTemplateText();
  });


//===============BINDING ENVENTS =========================//
//open repository list
  $(document).on("click",".file-open-dir", function(){
    $('#save').css({"display": "none"})
    $('#repo-browser').css({"display": "none"})
    $('#breadcrumbs').empty();
    $("#repositories").empty();
    $('#dir').css({"display": "block"})
    var url = "https://api.github.com/user/repos"
    displayRepoList(url, gon.access_token);
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
    loadText(url, gon.access_token)
  });
// open file from input url
  $("#file-manual").submit(function(e){
    e.preventDefault();
    $('#dir').css({"display": "none"})
    var url = $(this).find("#manual-url").val();
    loadText(url, gon.access_token)
  });
  //open file from directory list
  $(document).on("click",".file-open-file-list", function(){
    var path = $(this).attr("data-path");
    var branch = $(this).attr("data-branch");
    var branchSha = $(this).attr("data-branch");
    var repo = $(this).attr("data-repo");
    var url = "https://api.github.com/repos/" + repo + "/contents" + path + "?ref=" + branch;
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
  $(document).on("click", ".create-fork", function(){
    var url = $(this).attr("data-url");
    var repo = url.split("https://api.github.com/repos/")[1];
    console.log("repo for create fork", repo);
    createFork(repo, access_token);
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
  $(document).on("submit", "#create-new-branch", function(e){
    e.preventDefault();
    console.log(e)
    var branchName = $(e.target).find("#branch").val();
    var repo = $(e.target).find("#repo").val();
    var branchSourceSha = $(e.target).find("#branch-source-sha").val();
    createNewBranch(repo, branchName, branchSourceSha, access_token);
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
        $('#message').val("");
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
  var repo = repo_base.split("https://api.github.com/repos/")[1];
  $("#repo-browser-list").empty();
  $("#repo-browser").css({"display": "block"});
  $("#repo-browser-list").append('<h1>Available Branches</h1>');
  //$("#repo-browser-list").append('<p><a class="file-open-dir">' + "Back to Repo List" +'</a></li>');
  for (var i = 0, len = data.length; i < len; i++) {
    $("#repo-browser-list").append('<li><a class="file-open-branch" data-branch-sha="' + data[i].commit.sha + '" data-url="'+ repo_base + '" data-branch="' + data[i].name + '">' + data[i].name +'</a> --> create new branch --> <form id="create-new-branch"><input id="branch" name="branch" placeholder="gh-pages"></input><input type="hidden" id="repo" name="repo" value="' + repo + '"/><input type="hidden" id="branch-source-sha" name="branch-source-sha" value="' + data[i].commit.sha + '"/><input type="submit"/></form></li>');
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
  url = url + "?per_page=100";
  retrieveAPIData(url, access_token).done(function(data){
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
  if (branch === "gh-pages"){
    $("#repo-browser-branch").html('<p>' + branch + '</p><p><a href="http://' + repo.split('/')[0] +'.github.io/' + repo.split('/')[1] + '" target="_blank">View on gh-pages</a></p>');
  }
  else{
    $("#repo-browser-branch").html('<p>' + branch + '</p>');
  }

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

//Create new branch

function createNewBranch(repo, branchName, branchSourceSha, access_token){
  new_branch_data = {
      "ref": "refs/heads/" + branchName,
      "sha": branchSourceSha
    }
    var url = "https://api.github.com/repos/" + repo + "/" + "git/refs"
    var url_with_access = url.includes("?") ? url + "&access_token=" + access_token : url + "?access_token=" + access_token;
    console.log("url", url_with_access);
    console.log("new_branch_data", new_branch_data);
    $.ajax({
      url: url_with_access, // your api url
      type: 'post', // type is any HTTP method
      contentType: "application/json",
      //JSON.stringify seems required; it's the only way I could get it to work
      data: JSON.stringify(new_branch_data),

      success: function(data, status, res) {
        console.log(res)
        repo_base = "https://api.github.com/repos/" + repo;
        retrieveRepoTree(repo_base, access_token, branchName, branchSourceSha)
      },
      error: function(res, status, error){
        console.log(res, status, error)
      }
    });

}

function createFork(repo, access_token){
    var url = "https://api.github.com/repos/" + repo + "/forks";
    var url_with_access = url.includes("?") ? url + "&access_token=" + access_token : url + "?access_token=" + access_token;
    $.ajax({
      url: url_with_access, // your api url
      type: 'post', // type is any HTTP method
      success: function(data, status, res) {
        console.log("create fork response", res)
        var forkedRepoBase = res.responseJSON.url;
        getRepoBranches(forkedRepoBase, access_token);

      },
      error: function(res, status, error){
        console.log(res, status, error)
      }
    });

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
  aceEditor.setValue(content);
  aceEditor.clearSelection();
  aceEditor.gotoLine(0);
  aceEditor.scrollToLine(0);
}

function createPreviewContent(content){
  var newText = tei_conversion(content, function(data){});
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
    createPreviewContent(content);
    setSaveParameters(data);
  });
}
// TODO: this function still relies on a sinatra route, but should be any easy fix.
function loadTemplateText(){
  $.get("/doc", function(data){
    addXMLContent(data);
    createPreviewContent(data);
  });
}


// note: after a file is saved, if you immediately navigate away and then come back to that file
//github is sometimes still serviing the file, because it hasn't updated yet.
//This could cause some real headaches for users.

// TEI rendering

// custom tei conversion that doesn't repeat registering elements
// code pulled from CETEI library; registering elemeents fucntions is then cut-out
tei_conversion = function(TEI, callback, perElementFn){

  TEI_dom = ( new DOMParser() ).parseFromString(TEI, "text/xml");
  let convertEl = (el) => {
          // Create new element. TEI elements get prefixed with 'tei-',
          // TEI example elements with 'teieg-'. All others keep
          // their namespaces and are copied as-is.
          let newElement;
          let copy = false;
          switch (el.namespaceURI) {
            case "http://www.tei-c.org/ns/1.0":
              newElement = document.createElement("tei-" + el.tagName);
              break;
            case "http://www.tei-c.org/ns/Examples":
              if (el.tagName == "egXML") {
                newElement = document.createElement("teieg-" + el.tagName);
                break;
              }
            case "http://relaxng.org/ns/structure/1.0":
              newElement = document.createElement("rng-" + el.tagName);
              break;
            default:
              newElement = document.importNode(el, false);
              copy = true;
          }
          // Copy attributes; @xmlns, @xml:id, @xml:lang, and
          // @rendition get special handling.
          for (let att of Array.from(el.attributes)) {
              if (!att.name.startsWith("xmlns") || copy) {
                newElement.setAttribute(att.name, att.value);
              } else {
                if (att.name == "xmlns")
                newElement.setAttribute("data-xmlns", att.value); //Strip default namespaces, but hang on to the values
              }
              if (att.name == "xml:id" && !copy) {
                newElement.setAttribute("id", att.value);
              }
              if (att.name == "xml:lang" && !copy) {
                newElement.setAttribute("lang", att.value);
              }
              if (att.name == "rendition") {
                newElement.setAttribute("class", att.value.replace(/#/g, ""));
              }
          }
          // Preserve element name so we can use it later
          newElement.setAttribute("data-teiname", el.localName);
          // If element is empty, flag it
          if (el.childNodes.length == 0) {
            newElement.setAttribute("data-empty", "");
          }
          // Turn <rendition scheme="css"> elements into HTML styles
          if (el.localName == "tagsDecl") {
            let style = document.createElement("style");
            for (let node of Array.from(el.childNodes)){
              if (node.nodeType == Node.ELEMENT_NODE && node.localName == "rendition" && node.getAttribute("scheme") == "css") {
                let rule = "";
                if (node.hasAttribute("selector")) {
                  //rewrite element names in selectors
                  rule += node.getAttribute("selector").replace(/([^#, >]+\w*)/g, "tei-$1").replace(/#tei-/g, "#") + "{\n";
                  rule += node.textContent;
                } else {
                  rule += "." + node.getAttribute("xml:id") + "{\n";
                  rule += node.textContent;
                }
                rule += "\n}\n";
                style.appendChild(document.createTextNode(rule));
              }
            }
            if (style.childNodes.length > 0) {
              newElement.appendChild(style);
              this.hasStyle = true;
            }
          }
          // Get prefix definitions
          if (el.localName == "prefixDef") {
            this.prefixes.push(el.getAttribute("ident"));
            this.prefixes[el.getAttribute("ident")] =
              {"matchPattern": el.getAttribute("matchPattern"),
              "replacementPattern": el.getAttribute("replacementPattern")};
          }
          for (let node of Array.from(el.childNodes)){
              if (node.nodeType == Node.ELEMENT_NODE) {
                  newElement.appendChild(  convertEl(node)  );
              }
              else {
                  newElement.appendChild(node.cloneNode());
              }
          }
          if (perElementFn) {
            perElementFn(newElement);
          }
          return newElement;
      }

      html = convertEl(TEI_dom.documentElement);
      //console.log(html);
      return html;
}
