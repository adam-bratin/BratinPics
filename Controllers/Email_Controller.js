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
var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth();
var oauth2Client = new auth.OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIIENT_SECRET, "https://developers.google.com/oauthplayground");

var scopes = [
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify"
];

var url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
    scope: scopes // If you only need one scope you can pass it as string
});

oauth2Client.setCredentials({
    access_token: process.env.GMAIL_ACCESS_TOKEN,
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

exports.SendInviteEmail = function(req,inviteCode) {
    return new Promise((resolve,reject) => {
        try {
            var email_lines = [];
            email_lines.push(`To: ${inviteCode.Email}`);
            email_lines.push('Content-type: text/html;charset=iso-8859-1');
            email_lines.push('MIME-Version: 1.0');
            email_lines.push('Subject: You are invited to BratinPics');
            email_lines.push('');
            email_lines.push(`Hey come check out the Bratin family pictures.<br>`);
            email_lines.push(`Below is a link to register for an account.<br>`);
            email_lines.push(`${req.protocol}://${req.hostname}/register?invitecode=${inviteCode.InviteCode}`);
            email_lines.push('<br>');
            email_lines.push(`This code will expire in ${Math.round(moment.duration(moment(inviteCode.Expires).diff(moment(inviteCode.Issued))).asDays()) } days<br>`);
            email_lines.push(`Thanks,<br>`);
            email_lines.push(`BratinPics`);
            var message = email_lines.join('\r\n').trim();
            sendMessage(message).then(resolve, reject);
        } catch (err) {
            debug(err);
            reject(constants.StatusCodes.serverError);
        }
    });
};


exports.SendPasswordResetEmail = function(req,resetRequest) {
    return new Promise((resolve, reject) => {
        try {
            var message = {
                to: resetRequest.Email
                , subject: `Reset Password Request ${req.hostname}`
                , generateTextFromHTML: true
                , html: `A request came to change your password.<br>
            Below is a link to reset your password.<br>
            ${req.protocol}://${req.host}/resetPassword?resetCode=${resetRequest.ResetCode}<br>
            This code will expire in 
            ${Math.round(moment.duration(moment(resetRequest.Expires).diff(moment(resetRequest.Issued))).asMinutes()) } minutes<br> 
            Thanks,\r\n BratinPics`
            };
            var email_lines = [];
            email_lines.push(`To: ${resetRequest.Email}`);
            email_lines.push('Content-type: text/html;charset=iso-8859-1');
            email_lines.push('MIME-Version: 1.0');
            email_lines.push(`Reset Password Request on ${req.hostname}`);
            email_lines.push('');
            email_lines.push(`A request came to change your password.<br>`);
            email_lines.push(`Below is a link to reset your password.<br>`);
            email_lines.push(`${req.protocol}://${req.host}/resetPassword?resetCode=${resetRequest.ResetCode}<br>`);
            email_lines.push('<br>');
            email_lines.push(`This code will expire in 
                ${Math.round(moment.duration(moment(resetRequest.Expires).diff(moment(resetRequest.Issued)))
                    .asMinutes()) } minutes<br>`);
            email_lines.push(`Thanks,<br>`);
            email_lines.push(`BratinPics`);
            var message = email_lines.join('\r\n').trim();
            sendMessage(message).then(resolve, reject);
        } catch (err){
            debug(err);
            reject(constants.StatusCodes.serverError);
        }
    });
};

function sendMessage(message) {

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
                    debug(err);
                    reject(constants.StatusCodes.serverError);
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