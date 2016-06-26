/**
 * Created by abratin on 6/17/16.
 */
var constants = require('../public/Constants');
var debug = require('debug')('BratinPics:serverHTTPS');
var moment = require('moment');
var Account = require('../models/Account');
var ResetPasswordRequest = require('../models/ResetPasswordRequest');
var emailController = require('../Controllers/Email_Controller');
var uuid = require('node-uuid');

exports.handleLostPasswordRequest = function (req,res) {
  var lostUserEmail = req.body.username;
  if(!lostUserEmail) {
    var noEmailError = constants.StatusCodes.noEmailSent;
    return res.status(noEmailError.code).send(noEmailError.status);
  } else {
    getUserAccountByEmail(lostUserEmail)
    .then(generatePasswordResetRequest)
    .then((resetRequest)=>{
      return emailController.SendPasswordResetEmail(req,resetRequest);
    })
    .then(()=>{
      var ok = constants.StatusCodes.ok;
      res.status(ok.code).send(ok.status);
    })
    .catch((error)=>{
      res.status(error.code).send(error.status);
    });
  }
};

function generatePasswordResetRequest(lostUserEmail) {
  return new Promise((resolve, reject) => {
    try {
      var query = {
        Email: lostUserEmail.username
      };
      var newRequest = {
        Email: lostUserEmail.username,
        ResetCode: uuid.v1(),
        Redeemed: false,
        Issued: moment(),
        Expires: moment().add(1, 'hour')
      };
      var options = {
        new: true,
        upsert: true
      };
      ResetPasswordRequest.findOneAndUpdate(query, newRequest, options, function (err, resetRequest) {
        if (err) {
          debug(err);
          var serverError = constants.StatusCodes.serverError;
          reject(serverError);
        } else {
          resolve(resetRequest)
        }
      });
    } catch (error) {
      debug(error);
      var serverError = constants.StatusCodes.serverError;
      reject(serverError);
    }
  });
}

exports.handlePasswordChange = function (req, res) {
  var requestCode = req.body.resetcode;
  var newPassword = req.body.password;
  var confirmPassword = req.body.confirmPassword;
  validatePasswords(newPassword,confirmPassword).then(()=>{
    return validateResetRequest(requestCode)
  })
  .then(updateRequest)
  .then((request)=>{
    return getUserAccountByEmail(request.Email);
  })
  .then((user)=> {
    return setPassword(user,newPassword);
  })
  .then(updateAccount)
  .then(()=>{
    var ok = constants.StatusCodes.ok;
    res.status(ok.code).send(ok.status);
  })
  .catch((error)=>{
    res.status(error.code).send(error.status);
  });

};

exports.validateResetRequest = function(req,res) {
  var requestCode = req.query.resetCode;
  validateResetRequest(requestCode)
  .then((requestCode)=> {
    res.render('passwordReset', {requestCode:requestCode});
  })
  .catch((error)=>{
    res.status(error.code).send(error.status);
  });
};

function validatePasswords(password, confirmPassword) {
  return new Promise((resolve,reject)=> {
    try {
      if(!password) {
        var noPassword = constants.StatusCodes.missingPassword;
        reject(noPassword);
      } else if(!confirmPassword) {
        var noConfirmPassword = constants.StatusCodes.missingConfirmPassword;
        reject(noConfirmPassword);
      }  else if(password!==confirmPassword) {
        var noPasswordMatch = constants.StatusCodes.noPasswordMatch;
        reject(noPasswordMatch);
      } else {
        resolve();
      }
    } catch (error) {
      var serverError = constants.StatusCodes.serverError;
      reject(serverError);
    }
  });
}

function validateResetRequest(requestCode) {
  return new Promise((resolve,reject)=> {
    try {
      ResetPasswordRequest.findOne({ResetCode: requestCode}, function (err, resetRequest) {
        if(err) {
          debug(err);
          var serverError = constants.StatusCodes.serverError;
          reject(serverError);
        }  else if(!resetRequest) {
          var noCodeError = constants.StatusCodes.noCode;
          reject(noCodeError);
        } else if(resetRequest.Redeemed) {
          var requestRedeemed = constants.StatusCodes.codeRedeemed;
          reject(requestRedeemed);
        } else if (moment().diff(moment(resetRequest.Expires)) >= 0) {
          var codeExpired = constants.StatusCodes.codeExpired;
          reject(codeExpired);
        }  else {
          resolve(resetRequest);
        }
      });
    } catch (error) {
      debug(error);
      reject(error);
    }
  });
}

function updateRequest(resetRequest) {
  return new Promise((resolve,reject)=>{
    try {
      resetRequest.Redeemed = true;
      resetRequest.save(function (err) {
        if (err) {
          debug(err);
          var serverError = constants.StatusCodes.serverError;
          reject(serverError);
        } else {
          resolve(resetRequest);
        }
      });
    } catch (error) {
      debug(error);
      var serverError = constants.StatusCodes.serverError;
      reject(serverError);
    }
  });
}

function getUserAccountByEmail(email) {
    return new Promise((resolve, reject) => {
        try {
            Account.findByUsername(email, function(err, user) {
              if(err) {
                debug(err);
                var serverError = constants.StatusCodes.serverError;
                reject(serverError);
              } else if(!user) {
                var noUserError = constants.StatusCodes.noUserFound;
                reject(noUserError);
              } else {
                resolve(user);
              }
            })
        } catch(error) {
            debug(error);
            var serverError = constants.StatusCodes.serverError;
            reject(serverError);
        }
    });
}

function setPassword(user,newPassword) {
    return new Promise((resolve, reject) => {
        try {
            user.setPassword(newPassword,function(err) {
              if(err) {
                debug(err);
                var serverError = constants.StatusCodes.serverError;
                reject(serverError);
              } else {
                resolve(user);
              }
            })

        } catch(error) {
            debug(error);
            var serverError = constants.StatusCodes.serverError;
            reject(serverError);
        }
    });
}

function updateAccount(user) {
    return new Promise((resolve, reject) => {
        try {
            user.save(function (err) {
              if (err) {
                debug(err);
                var serverError = constants.StatusCodes.serverError;
                reject(serverError);
              } else {
                resolve(user);
              }
            });
        } catch(error) {
            debug(error);
            var serverError = constants.StatusCodes.serverError;
            reject(serverError);
        }
    });
}