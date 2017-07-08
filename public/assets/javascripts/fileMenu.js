$(document).ready(function(){
  var access_token = $("#aldfjds").text();
  var username = $("#username");
  // load empty template onload
  Util.loadTemplateText()
  //load empty template
  $(document).on("click","#file-new", function(){
    console.log("test")
    Util.loadTemplateText()
  });


//===============BINDING ENVENTS =========================//
//open repository list
  $(document).on("click",".file-open-dir", function(){
    console.log("new test");
    $('#editor').addClass("darkened");
    $('#preview').addClass("darkened");

    $('#save').removeClass("visible")
    $('#repo-browser').removeClass("visible")
    $('#breadcrumbs').empty();
    $("#repositories").empty();
    $('#dir').addClass("visible");
    var url = "https://api.github.com/user/repos"
    Open.displayOpenRepoList(url, access_token);
  });
//open save dialogue box
  $(document).on("click","#file-open-save", function(){
    $('#dir').removeClass("visible");
    $('#repo-browser').removeClass("visible");
    var url = "https://api.github.com/user/repos"
    SaveAs.displaySaveAsRepoList(url, access_token);
    $('#editor').addClass("darkened");
    $('#preview').addClass("darkened");
    $('#save').addClass("visible");

  });
  //opens list of branches in save as window
  $(document).on("click", ".file-open-save-as-repo", function(){
    var url = $(this).attr("data-url");
    var repo = url.split("https://api.github.com/repos/")[1];
    Util.clearSaveParamters();
    $("#repo").val(repo);
    $("#save-url").html("https://api.github.com/repos/" + $("#repo").val() + "/contents/" + $("#path").val() + "/" + $("#file-name").val() + "?ref=" + $("#branch").val());
    SaveAs.displaySaveAsRepoBranchList(url, access_token);
  });
  //opens top level tree in saveAs window for a given repo branch
  $(document).on("click", ".file-open-save-as-branch", function(){
    var url = $(this).attr("data-url");
    var branch = $(this).attr("data-branch");
    var branchSha = $(this).attr("data-branch-sha");
    $("#branch").val(branch);
    $("#sha").val(branchSha);
    $("#save-url").html("https://api.github.com/repos/" + $("#repo").val() + "/contents/" + $("#path").val() + "/" + $("#file-name").val() + "?ref=" + $("#branch").val());
    //retrieveDirectoryCommits(url, access_token)
    //retrieveRepoTree(url, access_token, branch, branchSha);
    SaveAs.displaySaveAsTree(url, branch, branchSha, access_token);
  });
  $(document).on("click", ".file-open-save-as-path", function(){
    var url = $(this).attr("data-url");
    var branch = $(this).attr("data-branch");
    var branchSha = $(this).attr("data-branch-sha");
    var path = $(this).attr("data-path");
    $("#path").val(path);
    $("#save-url").html("https://api.github.com/repos/" + $("#repo").val() + "/contents/" + $("#path").val() + "/" + $("#file-name").val() + "?ref=" + $("#branch").val());

    //retrieveDirectoryCommits(url, access_token)
    //retrieveRepoTree(url, access_token, branch, branchSha);
    SaveAs.displaySaveAsTree(url, branch, branchSha, access_token);
  });
  $(document).on("input", "#repo", function(e){
    $("#save-url").html("https://api.github.com/repos/" + $("#repo").val() + "/contents/" + $("#path").val() + "/" + $("#file-name").val() + "?ref=" + $("#branch").val());
  });
  $(document).on("input", "#path", function(e){
    $("#save-url").html("https://api.github.com/repos/" + $("#repo").val() + "/contents/" + $("#path").val() + "/" + $("#file-name").val() + "?ref=" + $("#branch").val());
  });
  $(document).on("input", "#file-name", function(e){
    $("#save-url").html("https://api.github.com/repos/" + $("#repo").val() + "/contents/" + $("#path").val() + "/" + $("#file-name").val() + "?ref=" + $("#branch").val());
  });
  $(document).on("input", "#branch", function(e){
    $("#save-url").html("https://api.github.com/repos/" + $("#repo").val() + "/contents/" + $("#path").val() + "/" + $("#file-name").val() + "?ref=" + $("#branch").val());
  });
  // open file events
  //open file from direct url list
  $(document).on("click",".file-open-file", function(){
    var url = $(this).attr("data-url");
    $('.file-window').removeClass("visible");
    $('#editor').removeClass("darkened");
    $('#preview').removeClass("darkened");
    Util.loadText(url, access_token)
  });
// open file from input url
  $("#file-manual").submit(function(e){
    e.preventDefault();
    $('#dir').removeClass("visible");
    var url = $(this).find("#manual-url").val();
    Util.loadText(url, access_token)
  });
  //open file from directory list
  $(document).on("click",".file-open-file-list", function(){
    var path = $(this).attr("data-path");
    var branch = $(this).attr("data-branch");
    var branchSha = $(this).attr("data-branch");
    var repo = $(this).attr("data-repo");
    var url = "https://api.github.com/repos/" + repo + "/contents" + path + "?ref=" + branch;
    $('.file-window').removeClass("visible");
    $('#editor').removeClass("darkened");
    $('#preview').removeClass("darkened");
    Recent.set(url);
    Util.loadText(url, access_token)
  });
  //directory or repo opening events
  //open respository from branch and display top level tree contents
  $(document).on("click", ".file-open-branch", function(){
    var url = $(this).attr("data-url");
    var branch = $(this).attr("data-branch");
    var branchSha = $(this).attr("data-branch-sha");
    var repo = url.split("https://api.github.com/repos/")[1];
    //retrieveDirectoryCommits(url, access_token)
    Open.displayOpenTree(url, access_token, branch, branchSha, "", repo);
  // select repo and liste available branches
  });
  $(document).on("click", ".file-open-repo", function(){
    var url = $(this).attr("data-url");
    var branch = $(this).attr("data-branch");
    Open.displayOpenRepoBranchList(url, access_token);

  });
  $(document).on("click", ".create-fork", function(){
    var url = $(this).attr("data-url");
    var repo = url.split("https://api.github.com/repos/")[1];
    Open.createOpenFork(repo, access_token);
  });
  //display contents of a git tree
  $(document).on("click",".file-open-tree", function(){
    var url = $(this).attr("data-url");
    var path = $(this).attr("data-path");
    var branch = $(this).attr("data-branch");
    var branchSha = $(this).attr("data-branch-sha");
    var repo = $(this).attr("data-repo");
    Open.displayOpenTree(url, access_token, branch, branchSha, path, repo);
  });
  $(document).on("submit", "#create-new-branch", function(e){
    e.preventDefault();
    var branchName = $(e.target).find("#branch").val();
    var repo = $(e.target).find("#repo").val();
    var branchSourceSha = $(e.target).find("#branch-source-sha").val();
    Open.createNewOpenBranch(repo, branchName, branchSourceSha, access_token);
  });
  $(document).on("submit", "#create-new-save-as-branch", function(e){
    e.preventDefault();
    var branchName = $(e.target).find("#branch").val();
    var repo = $(e.target).find("#repo").val();
    var branchSourceSha = $(e.target).find("#branch-source-sha").val();
    //displaySaveAsTree(url, branch, branchSha, access_token);
    SaveAs.createNewSaveAsBranch(repo, branchName, branchSourceSha, access_token);
  });

  $("#editor-wrapper").on("click", function(){
    $(".file-window").removeClass("visible");
    $('#editor').removeClass("darkened");
    $('#preview').removeClass("darkened");
  });

  $("#save-form").submit(function(e){
    e.preventDefault();
    var textContent = $("#editor-text-area").val();
    var content = Base64.encode(textContent);

    //var content = btoa($("#editor-text-area").text());
    var url = $(this).find("#save-url").text();
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

    SaveAs.saveFile(url, commit_data, access_token);
  });
});

var Util = {
  access_token: $("#aldfjds").text(),
  retrieveAPIData: function(url, access_token){
    url_with_access = url.includes("?") ? url + "&access_token=" + access_token : url + "?access_token=" + access_token;
    return $.get(url_with_access);
  },
  parseXMLContent: function(data){
    var content = Base64.decode(data.content);
    return content;
  },
  addXMLContent: function(content){
    $("#editor-text-area").val(content);
  },
  createPreviewContent: function(){
    var newText = tei_conversion($("#editor-text-area").val(), function(data){});
    $("#preview").html(newText);
  },
  setSaveParameters: function(data){
    var branch = data.url.split("?ref=")[1]
    var repo = data.repo ? data.repo : data.url.split("https://api.github.com/repos/")[1].split("/contents/")[0];
    path = data.path.split("/" + data.name)[0] === data.name ? "" : data.path.split("/" + data.name)[0];
    console.log(data)
    $("#sha").val(data.sha);
    $("#save-url").html(data.url);
    $("#repo").val(repo);
    $("#path").val(path);
    $("#file-name").val(data.name);
    $("#branch").val(branch);
    $('#message').val("");

    Doc.set(data)
    Repo.retrieveAndSetRepoState("https://api.github.com/repos/" + repo, Util.access_token)

  },
  clearSaveParamters: function(){
    $("#sha").val("");
    $("#save-url").html("");
    $("#repo").val("");
    $("#path").val("");
    $("#file-name").val("");
    $("#branch").val("");
    $('#message').val("");

    Doc.set({});
    Repo.set({});
  },
  loadText: function(url, access_token){
    var _this = this
    _this.retrieveAPIData(url, access_token).done(function(data){
      var content = Util.parseXMLContent(data);
      _this.addXMLContent(content);
      _this.createPreviewContent();
      _this.setSaveParameters(data);
    });
  },
  // TODO: this function still relies on a sinatra route, but should be any easy fix.
  loadTemplateText: function(){
    $.get("/doc", function(data){
      Util.clearSaveParamters();
      $("#editor-text-area").val(data);
      var newText = tei_conversion($("#editor-text-area").val(), function(data){});
      $("#preview").html(newText);
    });
  }
}

// note: after a file is saved, if you immediately navigate away and then come back to that file
//github is sometimes still serviing the file, because it hasn't updated yet.
//This could cause some real headaches for users.

//===========SAVE AS COMPONENT
var SaveAs = {
  saveFile: function(url, commitData, access_token){
    url_with_access = url.includes("?") ? url + "&access_token=" + access_token : url + "?access_token=" + access_token
    $.ajax({
      url: url_with_access, // your api url
      type: 'put', // type is any HTTP method
      contentType: "application/json",
      //JSON.stringify seems required; it's the only way I could get it to work
      data: JSON.stringify(commitData),

      success: function(data, status, res) {
        console.log(res.responseJSON.content)
        //updates save parameters; specifically it resets save form with newest shaw
        Util.setSaveParameters(res.responseJSON.content)
        $('#save').removeClass("visible");
        $('#editor').removeClass("darkened");
        $('#preview').removeClass("darkened");
      },
      error: function(res, status, error){
        console.log(res, status, error)
      }
    });
  },
  displaySaveAsTree: function(url, branch, branchSha, access_token){
    var tree_url = url;
    if ( url.includes("/git/trees/")){
      var tree_url = url;
    }
    else{
      var tree_url = url + "/git/trees/" + branch;
    }

    $("#save-as-file-browser-list-wrapper").empty();
    console.log("tree_url", tree_url)
    Util.retrieveAPIData(tree_url, access_token).done(function(data){
      var tree = data.tree;
      for (var i = 0, len = data.tree.length; i < len; i++) {
        if (tree[i].type === 'blob' && tree[i].path.includes('.xml')){
          $("#save-as-file-browser-list-wrapper").append('<li style="color: gray">' + tree[i].path +'</a></li>');
        }
        else if (tree[i].type === 'blob' && !tree[i].path.includes('.xml')){
          $("#save-as-file-browser-list-wrapper").append('<li style="color: gray">' + tree[i].path +'</li>');
        }
        else if (tree[i].type === 'tree'){
          $("#save-as-file-browser-list-wrapper").append('<li><a class="file-open-save-as-path" data-repo="' + repo + '" data-branch="' + branch + '" data-branch-sha="' + branchSha + '" data-url="'+ tree[i].url + '" data-path="' + tree[i].path + '">' + tree[i].path +'</a></li>');
        }
      }
    });

  },
  displaySaveAsRepoList: function(url, access_token){
    url = url + "?per_page=100";
    Util.retrieveAPIData(url, access_token).done(function(data){
      $("#repo-browser-branch").empty();
      $("#save-as-file-browser-list-wrapper").empty();
      for (var i = 0, len = data.length; i < len; i++) {
        $("#save-as-file-browser-list-wrapper").append('<li><a class="file-open-save-as-repo" data-url="'+ data[i].url + '">' + data[i].url +'</a></li>');
      }
    });
  },
  displaySaveAsRepoBranchList: function(repo_base, access_token){
    var url = repo_base + "/branches";
    var repo = repo_base.split("https://api.github.com/repos/")[1];
    $("#repo-browser-branch").empty();
    $("#save-as-file-browser-list-wrapper").empty();
    Util.retrieveAPIData(url, access_token).done(function(data){
      $("#save-as-file-browser-list-wrapper").empty();
      for (var i = 0, len = data.length; i < len; i++) {
        $("#save-as-file-browser-list-wrapper").append('<li><a class="file-open-save-as-branch" data-branch-sha="' + data[i].commit.sha + '" data-url="'+ repo_base + '" data-branch="' + data[i].name + '">' + data[i].name +'</a> --> create new branch --> <form id="create-new-save-as-branch"><input id="branch" name="branch" placeholder="gh-pages"></input><input type="hidden" id="repo" name="repo" value="' + repo + '"/><input type="hidden" id="branch-source-sha" name="branch-source-sha" value="' + data[i].commit.sha + '"/><input type="submit"/></form></li>');
      }
    });
  },
  createNewSaveAsBranch: function(repo, branchName, branchSourceSha, access_token){
    var _this = this;
    new_branch_data = {
        "ref": "refs/heads/" + branchName,
        "sha": branchSourceSha
      }
    var url = "https://api.github.com/repos/" + repo + "/" + "git/refs"
    var url_with_access = url.includes("?") ? url + "&access_token=" + access_token : url + "?access_token=" + access_token;

    $.ajax({
      url: url_with_access, // your api url
      type: 'post', // type is any HTTP method
      contentType: "application/json",
      //JSON.stringify seems required; it's the only way I could get it to work
      data: JSON.stringify(new_branch_data),

      success: function(data, status, res) {

        repo_base = "https://api.github.com/repos/" + repo;
        $("#branch").val(branchName);
        $("#sha").val(branchSourceSha);
        _this.displaySaveAsTree(repo_base, branchName, branchSourceSha, access_token);
      },
      error: function(res, status, error){
        console.log(res, status, error)
      }
    });
  }
}

//File Open COMPONENT

var Open = {
  displayOpenTree: function(repo_base, access_token, branch, branchSha, path, repo){
  //function displayTree(tree, path, branch, branchSha, repo, parent_tree_url){
  //function retrieveRepoTree(repo_base, access_token, branch, branchSha){
    $("#repo-browser-list").empty();
    $("#repo-browser-branch").empty();
    $("#repo-browser").addClass("visible");

    var parent_tree_url = repo_base;
    var branch = (typeof branch !== 'undefined') ?  branch : "master";

    if (repo_base.includes("/git/trees/")){
      var url = repo_base
    }
    else{
      var url = repo_base + "/git/trees/" + branch;
    }

    Util.retrieveAPIData(url, access_token).done(function(data){
      var tree = data.tree
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
    });
  },
  createNewOpenBranch: function(repo, branchName, branchSourceSha, access_token){
    var _this = this;
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
          _this.displayOpenTree(repo_base, access_token, branchName, branchSourceSha, repo)
        },
        error: function(res, status, error){
          console.log(res, status, error)
        }
      });

  },
  displayOpenRepoBranchList: function(repo_base, access_token){
    var url = repo_base + "/branches";
    Util.retrieveAPIData(url, access_token).done(function(data){

      var repo = repo_base.split("https://api.github.com/repos/")[1];
      $("#repo-browser-list").empty();
      $("#repo-browser").addClass("visible");
      $("#repo-browser-list").append('<h1>Available Branches</h1>');
      //$("#repo-browser-list").append('<p><a class="file-open-dir">' + "Back to Repo List" +'</a></li>');
      for (var i = 0, len = data.length; i < len; i++) {
        $("#repo-browser-list").append('<li><a class="file-open-branch" data-branch-sha="' + data[i].commit.sha + '" data-url="'+ repo_base + '" data-branch="' + data[i].name + '">' + data[i].name +'</a> --> create new branch --> <form id="create-new-branch"><input id="branch" name="branch" placeholder="gh-pages"></input><input type="hidden" id="repo" name="repo" value="' + repo + '"/><input type="hidden" id="branch-source-sha" name="branch-source-sha" value="' + data[i].commit.sha + '"/><input type="submit"/></form></li>');
      }
    });
  },
  displayOpenRepoList: function(url, access_token){
    url = url + "?per_page=100";
    Util.retrieveAPIData(url, access_token).done(function(data){
      $("#repo-browser-branch").empty();
      $("#recentfiles").empty();
      for (var i = 0, len = Recent.files.length; i < len; i++) {
        $("#recentfiles").append('<li><a class="file-open-file" data-url="'+ Recent.files[i] + '">' + Recent.files[i] +'</a></li>');
      }
      for (var i = 0, len = data.length; i < len; i++) {
        $("#repositories").append('<li><a class="file-open-repo" data-url="'+ data[i].url + '">' + data[i].url +'</a></li>');
      }
    });
  },
  createOpenFork: function(repo, access_token){
      var url = "https://api.github.com/repos/" + repo + "/forks";
      var url_with_access = url.includes("?") ? url + "&access_token=" + access_token : url + "?access_token=" + access_token;
      $.ajax({
        url: url_with_access, // your api url
        type: 'post', // type is any HTTP method
        success: function(data, status, res) {

          var forkedRepoBase = res.responseJSON.url;
          Open.displayOpenRepoBranchList(forkedRepoBase, access_token);
          //getRepoBranches(forkedRepoBase, access_token);

        },
        error: function(res, status, error){
          console.log(res, status, error)
        }
      });

  }

}

var Doc = {
  state: {},
  set: function(data){
    this.state = data;
  }
}

var Repo = {
  state: {},
  set: function(data){
    this.state = data
  },
  retrieveAndSetRepoState: function(url, access_token){
    var _this = this;
    Util.retrieveAPIData(url, access_token).done(function(data){
      _this.set(data);
      console.log("repo state", _this.state);
    });
  }
}

var Recent = {
  files: [],
  set: function(file){
    this.files.push(file);
  }

}
