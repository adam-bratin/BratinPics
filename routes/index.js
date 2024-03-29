//libraries
var path = require('path');
var express = require('express');
var router = express.Router();
var passport = require('passport');
var debug = require('debug')('BratinPics:serverHTTPS');
var multer  = require('multer');

//Controllers
var imageController = require('../Controllers/Image_Controller');
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

// router.get('/gmailAuthorized',oAuthController.HandleTokenRequest);

router.get('/invite',ensureAuthenticated, function(req,res) {
    res.render('invite');
});

router.post('/invite', ensureAuthenticated, inviteController.HandleInvite);

router.get('/register', registerController.isValidInviteCode, function(req, res) {
  res.render('register', {"InviteCode": req.query.invitecode});
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

router.get('/forgotPassword', function(req, res) {
  
});

router.post('/uploadFiles',ensureAuthenticated,upload.array('uploads[]'),
  imageController.saveImages);


module.exports = router;

