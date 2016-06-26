/**
 * Created by abratin on 6/19/16.
 */


window.onload = function () {
  var pass = $("#password");
  var confirmPass = $("#confirmPassword");
  pass.focusout((evt)=>{
    validatePassword($(evt.target));
  });
  pass.keyup(handleKeyPress);
  confirmPass.focusout((evt)=>{
    validatePassword($(evt.target));
  });
  confirmPass.keyup(handleKeyPress);
};

function handleKeyPress(evt) {
  if(event.keyCode == 13){
    validatePassword($(evt.target));
  }
}

function validatePassword(element){
  var pass=$("#password").val();
  var passEl=$("#password").get(0);
  var confirmPass=$("#confirmPassword").val();
  var confirmPassEl=$("#confirmPassword").get(0);
  if(!pass) {
    passEl.setCustomValidity('Please Enter a Password');
  } else if(!confirmPass) {
    confirmPassEl.setCustomValidity('Please Enter a Password');
  } else if(confirmPass!==pass) {
    passEl.setCustomValidity("Passwords Don't Match");
    confirmPassEl.setCustomValidity("Passwords Don't Match");
  }
  else {
    passEl.setCustomValidity('');
    confirmPassEl.setCustomValidity('');
  //empty string means no validation error
  }
  console.log(element[0].validity.customError);
  // element[0].reportValidity();
}

$('form').submit(function(evt) {
  evt.preventDefault();
  var form = $(this);
  var password = $("#password");
  var confirmPassword = $("#confirmPassword");

  if(!password.get(0).checkValidity() || !confirmPassword.get(0).checkValidity()) {
    password.get(0).reportValidation();
    confirmPassword.get(0).reportValidation();
  } else {
    $.post({
      url:form.attr('action'),
      // data: data,
      data: form.serialize(),
      dataType: "json",
      processData: false
    })
      .success((data,status)=>{
        $("#status").text("Password Changed");
      })
    .fail((data,status)=>{
      $("#status").text(data.responseText);
    });
  }
});