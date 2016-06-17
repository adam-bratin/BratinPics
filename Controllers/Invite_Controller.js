var constants = require('../public/Constants'),
  debug = require('debug')('BratinPics:serverHTTPS'),
  Account = require('../models/Account');
  InviteCode = require('../models/InviteCode'),
  emailController = require('../Controllers/Email_Controller');

exports.HandleInvite = function(req,res) {
  var recipientEmail = req.body.recipientEmail;
  if (!recipientEmail) {
    var badEmail = constants.StatusCodes.badEmail;
    res.status(badEmail.code).send(badEmail.status);
  } else {
    var verifyAccountPromise = verifyAccount(recipientEmail);
    var verifyInvitePromise = verifyInvite(recipientEmail);
    Promise.all([verifyInvitePromise, verifyAccountPromise])
    .then(results=> {
      return saveCode(recipientEmail);
    })
    .then(code=> {
      return emailController.SendInviteEmail(req, code);
    })
    .then((result)=> {
      return res.status(result.code).send(result.status);
    })
    .catch(error=> {
      return res.status(error.code).send(error.status);
    });
  }
};


function verifyInvite(recipientEmail) {
  return new Promise((resolve,reject)=>{
    InviteCode.findOne({Email: recipientEmail}, (error, code)=> {
      if(error) {
        debug(error);
        reject(constants.StatusCodes.serverError);
      } else if(code) {
        reject(constants.StatusCodes.dupEmail);
      } else {
        resolve(true);
      }
    });
  });
}


function verifyAccount(recipientEmail) {
  return new Promise((resolve, reject)=> {
    Account.findOne({username: recipientEmail}, function(error, user) {
      if(error) {
        debug(error);
        reject(constants.StatusCodes.serverError);
      } else if(user) {
        reject(constants.StatusCodes.dupEmail);
      } else {
        resolve(true);
      }
    });
  });
}

function saveCode(recipientEmail) {
  return new Promise((resolve, reject)=> {
    var code = new InviteCode({Email: recipientEmail});
    code.save(function (err) {
      if (err) {
        debug(err);
        return reject(constants.StatusCodes.serverError)
      } else {
        resolve(code);
      }
    });
  });
}