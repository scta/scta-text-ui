$(document).ready(function(){
  var access_token = $("#aldfjds").text();
  console.log(access_token);
  var newText = tei_conversion($("#editor-text-area").val(), function(data){});
  $("#preview").html(newText);

  $(document).on("click","#file-new", function(){
    $.get("/doc", function(data){
      $("#editor-text-area").html(data);
      var newText = tei_conversion($("#editor-text-area").val(), function(data){});
      $("#preview").html(newText);
    });
  });
  $(document).on("click","#file-open-dir", function(){
    $('#dir').css({"display": "block"})
    $.get("https://api.github.com/user/repos?access_token=" + access_token, function(data){
      console.log(data)
      for (var i = 0, len = data.length; i < len; i++) {
        $("#repositories").append('<li><a class="file-open-file" data-url="'+ data[i].url + '">' + data[i].url +'</a></li>');
      }
    });
  });
  $(document).on("click",".file-open-file", function(){

    var url = $(this).attr("data-url");

    $('#dir').css({"display": "none"})
    $.get("/doc?url=" + url, function(data){
      $("#editor-text-area").html(data);
      var newText = tei_conversion($("#editor-text-area").val(), function(data){});
      $("#preview").html(newText);
    });
  });
  $("#file-manual").submit(function(e){
    e.preventDefault();
    console.log(this);
    var url = $(this).find("#url").val();
    // repetition of above; should be abstracted outline$('#dir').css({"display": "none"})
    $('#dir').css({"display": "none"})
    $.get("/doc?url=" + url, function(data){
      $("#editor-text-area").html(data);
      var newText = tei_conversion($("#editor-text-area").val(), function(data){});
      $("#preview").html(newText);
    });
  });
});
