/**
 * Created by abratin on 6/9/16.
 */
var nodemailer = require("nodemailer");
var xoauth2 = require('xoauth2');
var debug = require('debug')('BratinPics:serverHTTPS');
var constants = require("../public/Constants");
var google = require('googleapis');
var gmail = google.gmail('v1');
var moment = require('moment');
var oauth2Client = require('../Controllers/Oauth_Controller').oauth2Client;

exports.SendInviteEmail = function(req,inviteCode) {
    return new Promise((resolve,reject) => {
        try {
            var stack = process.env.STACK || "";
            var email_lines = [];
            email_lines.push(`To: ${inviteCode.Email}`);
            email_lines.push('Content-type: text/html;charset=iso-8859-1');
            email_lines.push('MIME-Version: 1.0');
            email_lines.push('Subject: You are invited to BratinPics');
            email_lines.push('');
            email_lines.push(`Hey come check out the Bratin family pictures.<br>`);
            email_lines.push(`Below is a link to register for an account.<br>`);
            email_lines.push(`${req.protocol}://${req.hostname}:${stack === 'Debug' ? req.socket.localPort : ''}/register?invitecode=${inviteCode.InviteCode}`);
            email_lines.push('<br>');
            email_lines.push(`This code will expire in ${Math.round(moment.duration(moment(inviteCode.Expires).diff(moment(inviteCode.Issued))).asDays()) } days<br>`);
            email_lines.push(`Thanks,<br>`);
            email_lines.push(`BratinPics`);
            var message = email_lines.join('\r\n').trim();
            sendMessage(message,true).then(resolve).catch(reject);
        } catch (err) {
            debug(err);
            reject(constants.StatusCodes.serverError);
        }
    });
};


exports.SendPasswordResetEmail = function(req,resetRequest) {
  return new Promise((resolve, reject) => {
    try {

      var stack = process.env.STACK || "";
      var email_lines = [];
      email_lines.push(`To: ${resetRequest.Email}`);
      email_lines.push('Content-type: text/html;charset=iso-8859-1');
      email_lines.push('MIME-Version: 1.0');
      email_lines.push(`Subject: Reset Password Request for ${req.hostname}`);
      email_lines.push('');
      email_lines.push(`A request came to change your password.<br>`);
      email_lines.push(`Below is a link to reset your password.<br>`);
      email_lines.push(`${req.protocol}://${req.hostname}:${stack === 'Debug' ? req.socket.localPort : ''}/resetPassword?resetCode=${resetRequest.ResetCode}`);
      email_lines.push('<br>');
      email_lines.push(`This code will expire in Math.round(moment.duration(moment(resetRequest.Expires).diff(moment(resetRequest.Issued))).asMinutes()) } minutes<br>`);
      email_lines.push(`Thanks,<br>`);
      email_lines.push(`BratinPics`);
      var message = email_lines.join('\r\n').trim();
      sendMessage(message,true).then(resolve).catch(reject);
    } catch (err){
        debug(err);
        reject(constants.StatusCodes.serverError);
    }
  });
};

function sendMessage(message, retry) {
  return new Promise((resolve, reject)=> {
    try {
      var encodedMessage = new Buffer(message).toString('base64');
      var sendRequest = gmail.users.messages.send({
          auth: oauth2Client,
          userId: 'bratinpics@gmail.com',
          resource: {
              raw: encodedMessage.replace(/\+/g, '-').replace(/\//g, '_')
          }
      }, function (err, response) {
          if (err) {
              if(err.code == 401 && retry) {
                  refreshAndResend(resolve,reject,message);
              } else {
                  debug(err);
                  reject(constants.StatusCodes.serverError);
              }
          } else {
              resolve(constants.StatusCodes.ok);
          }
      });

    } catch (error) {
      debug(error);
      reject(constants.StatusCodes.serverError);
    }
  });
}

function refreshAndResend(resolve,reject, message) {
    oauth2Client.refreshTokens(true)
    .then(function(){
      return sendMessage(message,false);
    })
    .then(resolve)
    .catch(reject);
}