/**
 * Created by abratin on 6/9/16.
 */
var nodemailer = require("nodemailer");
var xoauth2 = require('xoauth2');
var debug = require('debug')('BratinPics:serverHTTPS');

var smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        xoauth2: xoauth2.createXOAuth2Generator({
            user: process.env.GMAIL_USER, // Your gmail address.
            // Not @developer.gserviceaccount.com
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN
        })
    }
});


exports.SendInviteEmail = function(req,inviteCode, callback) {
    try {
        var message = {
            to: inviteCode.Email
            , subject: `You are invited to BratinPics`
            , generateTextFromHTML: true
            , html: `Hey come check out the Bratin family pictures.<br>
        Below is a link to register for an account.<br>
        ${req.protocol}://${req.host}:${process.env.HTTPS_PORT}/register?invitecode=${inviteCode.InviteCode}<br>
        This code will expire in 
        ${Math.round((inviteCode.Expires.getTime() - inviteCode.Issued.getTime()) / 86400000) } days<br> 
        Thanks,\r\n BratinPics`
        };

        smtpTransport.sendMail(message, function(error, response) {
            smtpTransport.close();
            if (error) {
                debug(error);
                callback(error,response);
            } else {
                callback(error,response);
            }
        });
    } catch (err){
        debug(err);
    }
};