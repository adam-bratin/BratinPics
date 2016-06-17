/**
 * Created by abratin on 6/16/16.
 */
var constants = require('../public/Constants');
var debug = require('debug')('BratinPics:serverHTTPS');
var oAuthToken = require("../models/OAuthToken");
var moment = require('moment');
var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth();
exports.oauth2Client = new auth.OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIIENT_SECRET, "http://localhost:8080/gmailAuthorized");
var scopes = [
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify"
];

exports.authorizationUrl = exports.oauth2Client.generateAuthUrl({
  access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
  scope: scopes, // If you only need one scope you can pass it as string
  approval_prompt:"force"
});

// debug(exports.authorizationUrl);
exports.HandleTokenRequest = function(req,res) {
  getTokens(req.query.code)
  .then(tokens=>{
    return saveTokens(tokens,process.env.GMAIL_USER,"Google");
  })
  .then(function(tokens) {
    exports.oauth2Client.setCredentials(modelToAuthObject(tokens));
    var ok = constants.StatusCodes.ok;
    res.status(ok.code).send(ok.status);
  })
  .catch(error=> {
    res.status(error.code).send(error.status);
  });
};

function getTokens(code) {
  return new Promise((resolve, reject) => {
    try {
      exports.oauth2Client.getToken(code, function (error, token) {
        if(error) {
          debug(error);
          var serverError = constants.StatusCodes.serverError;
          reject(serverError);
        } else {
          resolve(token);
        }
      })
    } catch (err) {
      debug(err);
      reject(err)
    }
  });
}

exports.loadOauthClient = function (forceRefresh) {
  return new Promise((resolve,reject)=> {
    queryToken()
    .then(function (tokens) {
      exports.oauth2Client.setCredentials(modelToAuthObject(tokens));
      if (moment().diff(moment(tokens.Expires)) >= 0 || forceRefresh) {
        return exports.refreshTokens(tokens);
      } else {
        exports.oauth2Client.setCredentials(modelToAuthObject(tokens));
        return null;
      }
    })
    .then(tokens=>{
      if(tokens) {
        return saveTokens(tokens);
      }
    })
    .then(function(tokens) {
      if(tokens) {
        exports.oauth2Client.setCredentials(modelToAuthObject(tokens));
      }
      resolve();
    })
    .catch(reject);
  });
};

function saveTokens(tokens,username,provider) {
 return new Promise((resolve,reject) =>{
   try {
     var options = {
       // Return the document after updates are applied
       new: true,
       // Create a document if one isn't found. Required
       // for `setDefaultsOnInsert`
       upsert: true,
       setDefaultsOnInsert: true
     };
     var query = {username:username};
     var newToken = {
       Provider : provider,
       username : username,
       Access_token: tokens.access_token,
       Refresh_token: tokens.refresh_token,
       Expires : moment(tokens.expiry_date)
     };
     oAuthToken.findOneAndUpdate(query,newToken,options, function (err,tokens) {
       if (err) {
         debug(err);
         var serverError = constants.StatusCodes.serverError;
         reject(serverError);
       } else {
         resolve(tokens);
       }
     });
   } catch (error) {
     debug(error);
     var serverError = constants.StatusCodes.serverError;
     reject(serverError);
   }
 })
}

exports.refreshTokens = function(tokens) {
  return new Promise((resolve, reject)=> {
    try {
      exports.oauth2Client.refreshToken_(tokens.Refresh_token, function (err, tokens, response) {
        if (err) {
          debug(err);
          var serverError = constants.StatusCodes.serverError;
          reject(serverError);
        } else {
          resolve(tokens);
        }
      });
    } catch(error) {
      debug(error);
      var serverError = constants.StatusCodes.serverError;
      reject(serverError);
    }
  });
};

function queryToken() {
  return new Promise((resolve,reject)=>{
    try {
      oAuthToken.findOne({
        Provider: "Google",
        username: process.env.GMAIL_USER
      }, function (error, tokens) {
        if (error) {
          debug(error)
        }
        if (error || !tokens) {
          var serverError = constants.StatusCodes.serverError;
          reject(serverError);
        } else {
          resolve(tokens);
        }
      })
    } catch (err) {
      debug(err);
      var serverError = constants.StatusCodes.serverError;
      reject(serverError);
    }
  });
}

function modelToAuthObject(tokens) {
  return {
    access_token: tokens.Access_token,
    refresh_token: tokens.Refresh_token,
    expiry_date: tokens.Expires
  };
}