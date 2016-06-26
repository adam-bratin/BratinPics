/**
 * Created by abratin on 6/25/16.
 */
$('form').submit(function(e) {
  e.preventDefault();
  var form = $(this);
  $.post({
    url:form.attr('action'),
    // data: data,
    data: form.serialize(),
    dataType: "json",
    processData: false
  })
  .success((data,status)=>{
    if(data.url) {
      window.location.href = data.url;
    }
  })
  .fail((data,status)=>{
    $("#status").text(data.responseText);
  });
});

$('#forgotPassword').click(function(e) {
  e.preventDefault();
  var usernameElm = $('#username');
  if(usernameElm[0].checkValidity()) {
    var forgotPassword = $(this);
    var data = {
      username: usernameElm.val()
    };
    $.post({
      url: forgotPassword.attr('data-action'),
      data: JSON.stringify(data),
      dataType: 'json',
      contentType: 'application/json'
    })
    .always((data,status)=> {
      $("#status").text(data.responseText);
    });
  } else {
    usernameElm[0].reportValidity();
  }
});