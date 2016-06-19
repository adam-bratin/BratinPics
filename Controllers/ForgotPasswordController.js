/**
 * Created by abratin on 6/17/16.
 */
var constants = require('../public/Constants');
var debug = require('debug')('BratinPics:serverHTTPS');
var moment = require('moment');
var Account = require('../models/Account');
var ResetPasswordRequest = require('../models/ResetPasswordRequest');
var uuid = require('node-uuid');

exports.HandleLostPasswordRequest = function(req,res) {
  var lostUserEmail = req.query.username;
  if(lostUserEmail) {
    Account.findByUsername(lostUserEmail, function (err, user) {
      if(err) {
        debug(err);
        var serverError = constants.StatusCodes.serverError;
        res.render('error', {message:serverError.status, error: new Error(serverError.status)});
        // res.status(serverError.code).send(serverError.status);
      }
      if(!user) {
        var noUserFound = constants.StatusCodes.noUserFound;
        res.render('error', {message:noUserFound.status, error: new Error(noUserFound.status)});
        // res.status(noUserFound.code).send(noUserFound.status);
      } else {
        var query = { Email: lostUserEmail};
        var newRequest = {
          Email: lostUserEmail,
          ResetCode: uuid.v1(),
          Redeemed:false,
          Issued: moment(),
          Expires: moment().add(1,'hour')
        };
        ResetPasswordRequest.findOneAndUpdate(query,newRequest,{new:true, upsert:true},function(err,resetRequest) {
          if(err){
            debug(err);
            var serverError = constants.StatusCodes.serverError;
            res.status(serverError.code).send(serverError.status);
          } else {
            emailController.SendPasswordResetEmail(req,resetRequest).then(function(error){
              var status = error ? constants.StatusCodes.serverError : constants.StatusCodes.ok;
              res.status(status.code).send(status.status);
            })
          }
        })
      }
    });
  } else {
    res.status(400).send('no email send')
  }
};