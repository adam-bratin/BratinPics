/**
 * Created by abratin on 6/15/16.
 */

var InviteCode = require('../models/InviteCode');
var Account = require('../models/Account');
var constants = require("../public/Constants");
var moments = require("moments");

exports.registerUser = function (res, req, next) {
  var inviteCode = req.body.invitecode;
  var foundCode;
  verifyInviteCode(inviteCode)
    .then((code)=> {
      foundCode = code;
      return registerAccount(username, password);
    })
    .then((result)=> {
      return updateCode(foundCode)
    })
    .then(next,(error) =>{
      res.status(error.code).send(status);
    });
};

exports.isValidInviteCode = function(res,req,next) {
  var inviteCode = req.query.invitecode;
  verifyInviteCode(inviteCode).then((code)=>{
    next();
  }, (error) => {
    res.status(error.code).send(error.status);
  });
};

function registerAccount(username, password) {
  return new Promise((resolve, reject)=> {
    Account.register(new Account({username: username}), password, function (err, account) {
      if (err) {
        debug(err);
        var serverError = constants.StatusCodes.serverError;
        reject(serverError);
      } else {
        resolve(account);
      }
    });
  });
}
function updateCode(inviteCode) {
  return new Promise((resolve, reject)=> {
    inviteCode.Redemed = true;
    inviteCode.save(function (err) {
      if (err) {
        var serverError = constants.StatusCodes.serverError;
        reject(serverError);
      } else {
        resolve();
      }
    });
  });
}

function verifyInviteCode(code) {
  return new Promise((resolve, reject)=> {
    if(!code) {
    var noCode = constants.StatusCodes.noCode;
      reject(noCode);
    } else {
      InviteCode.findOne({InviteCode: invitecode}, function (err, foundCode) {
        if (err) {
          debug(err);
          var serverError = constants.StatusCodes.serverError;
          reject(serverError);
        } else if (!foundCode) {
          var codeNotFound = constants.StatusCodes.codeNotFound;
          reject(codeNotFound);
        } else if (foundCode.Redemed) {
          res.status(400).send("code already redeemed");
          var codeRedeemed = constants.StatusCodes.codeRedeemed;
          reject(codeRedeemed);
        } else if (moments().diff(moments(foundCode.Expires)) < 0) {
          var codeExpired = constants.StatusCodes.codeExpired;
          reject(codeExpired);
        } else {
          resolve(foundCode);
        }
      });
    }
  });
}