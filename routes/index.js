//libraries
var path = require('path');
var express = require('express');
var router = express.Router();
var passport = require('passport');
var debug = require('debug')('BratinPics:serverHTTPS');
var multer  = require('multer');
var constants = require("../public/Constants");

//Models
var Account = require('../models/Account');
var ResetPasswordRequest = require('../models/ResetPasswordRequest');

//Controllers
var imageController = require('../Controllers/Image_Controller');
var emailController = require('../Controllers/Email_Controller');
var inviteController = require('../Controllers/Invite_Controller');
var registerController = require('../Controllers/Register_Controller');

//Upload Files Middleware
var upload = multer({ dest: path.join(__dirname,'../tmp/'), fileFilter: function(req,file,cb) {
  if(/image\/*/.test(file.mimetype)) {
    // To accept the file pass `true`, like so:
    cb(null, true);
  } else {
    // To reject this file pass `false`, like so:
    cb(null, false)
  }
}
});

//Authentication MiddleWare
 function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }  else {
  // Return error content: res.jsonp(...) or redirect: res.redirect('/login')
    res.redirect('/login');
  }
}

//Routes
/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.isAuthenticated()) {
    imageController.findImagesBySubmitter(req.user).then(function(images) {
      res.render('index', { title: 'Express', loggedInUser: req.user, images: images});
    });
  } else {
    res.render('index', { title: 'Express', loggedInUser: req.user });
  }

});

router.get('/invite',ensureAuthenticated, function(req,res) {
    res.render('invite');
});

router.post('/invite', ensureAuthenticated, inviteController.HandleInvite);

router.get('/register', registerController.isValidInviteCode, function(req, res) {
  res.render('register', {"InviteCode": invite});
});

router.post('/register', registerController.registerUser, function(req, res) {
  passport.authenticate('local')(req, res, function () {
    res.redirect('/');
  });
});

router.get('/login', function(req, res) {
  res.render('login', { user : req.user });
});

router.post('/login', passport.authenticate('local'), function(req, res) {
  res.redirect('/');
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

router.post('/forgotPassword', function(req, res) {
  var lostUserEmail = req.body.lostUserEmail;
  if(lostUserEmail) {
    Account.findByUsername(lostUserEmail, function (err, user) {
      if(err) {
        debug(err);
        var serverError = constants.StatusCodes.serverError;
        res.status(serverError.code).send(serverError.status);
      } 
      if(!user) {
        var noUserFound = constants.StatusCodes.noUserFound;
         res.status(noUserFound.code).send(noUserFound.status);
       } else {
        var resetRequest = new ResetPasswordRequest({Email:lostUserEmail});
        resetRequest.save(function(err) {
          if(err){
            debug(err);
            var serverError = constants.StatusCodes.serverError;
            res.status(serverError.code).send(serverError.status);
          } else {
            emailController.SendInviteEmail().then(function(error){
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
});

router.post('/uploadFiles',ensureAuthenticated,upload.array('uploads[]'),function(req,res) {
  try {
    if(req.files.length<1) {
      res.status(400).send('no files uploaded');
    } else {
      var savedFiles = [];
      var requests = req.files.map((item) => {
        return new Promise((resolve) => {
          imageController.saveImage(item, req.user, resolve);
        });
      });
      Promise.all(requests)
        .catch(function(err) {
          // log that I have an error, return the entire array;
          debug('Image failed to save', err);
          return requests;
        })
        .then(function(images) {
          for(var i in images) {
            var image = images[i];
            if(image) {
              savedFiles.push(image.name);
            }
          }
          res.status(200).json({
            filesSaved: savedFiles
          });
        });
    }
  } catch (error) {
    debug(error);
    res.status(500).send('could not upload files');
  }
});


module.exports = router;

