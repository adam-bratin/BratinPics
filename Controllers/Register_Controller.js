/**
 * Created by abratin on 6/15/16.
 */

var InviteCode = require('../models/InviteCode');
var Account = require('../models/Account');
var constants = require("../public/Constants");
var moment = require('moment');
var debug = require('debug')('BratinPics:serverHTTPS');

exports.registerUser = function (req, res, next) {
  var inviteCode = req.body.invitecode;
  var foundCode;
  try {
    verifyInviteCode(inviteCode)
      .then((code)=> {
        foundCode = code;
        return registerAccount(req.body.username, req.body.password);
      })
      .then((result)=> {
        return updateCode(foundCode)
      })
      .then(next, (error) => {
        res.status(error.code).send(status);
      })
      .catch(error=> {
        res.status(error.code).send(error.status);
      });
  } catch(error) {
    debug(error);
    var serverError = constants.StatusCodes.serverError;
    res.status(serverError.code).send(serverError.status);
  }
};

exports.isValidInviteCode = function(req,res,next) {
  var inviteCode = req.query.invitecode;
  verifyInviteCode(inviteCode).then((code)=>{
    next();
  })
  .catch(error => {
    res.status(error.code).send(error.status);
  });
};

function registerAccount(username, password) {
  return new Promise((resolve, reject)=> {
    try {
      Account.register(new Account({username: username}), password, function (err, account) {
        if (err) {
          debug(err);
          var serverError = constants.StatusCodes.serverError;
          reject(serverError);
        } else {
          resolve(account);
        }
      });
    } catch(error) {
      debug(error);
      var serverError = constants.StatusCodes.serverError;
      reject(serverError);
    }
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
    try {
      if(!code) {
      var noCode = constants.StatusCodes.noCode;
        reject(noCode);
      } else {
        InviteCode.findOne({InviteCode: code}, function (err, foundCode) {
          if (err) {
            debug(err);
            var serverError = constants.StatusCodes.serverError;
            reject(serverError);
          } else if (!foundCode) {
            var codeNotFound = constants.StatusCodes.codeNotFound;
            reject(codeNotFound);
          } else if (foundCode.Redemed) {
            var codeRedeemed = constants.StatusCodes.codeRedeemed;
            reject(codeRedeemed);
          } else if (moment().diff(moment(foundCode.Expires)) >= 0) {
            var codeExpired = constants.StatusCodes.codeExpired;
            reject(codeExpired);
          } else {
            resolve(foundCode);
          }
        });
      }
    } catch(error) {
      debug(error);
      var serverError = constants.StatusCodes.serverError;
      reject(serverError);
    }
  });
}