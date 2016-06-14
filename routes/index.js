var path = require('path');
var express = require('express');
var util = require('util');
var passport = require('passport');
var Account = require('../models/Account');
var router = express.Router();
var InviteCode = require('../models/InviteCode');
var imageController = require('../Controllers/Image_Controller');
var emailController = require('../Controllers/Email_Controller');
var debug = require('debug')('BratinPics:serverHTTPS');
var multer  = require('multer');
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

 function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }  else {
  // Return error content: res.jsonp(...) or redirect: res.redirect('/login')
    res.redirect('/login');
  }
}

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

router.post('/invite',function (req,res) {
  if(req.isAuthenticated()) {
    var recipientEmail = req.body.recipientEmail;
    if(!recipientEmail) {
      res.status(400).send("no receipient emailController");
    } else {
      Account.findByUsername(recipientEmail, function (err, user) {
        if(err) {
          res.status(500).send('unable to process your request (check email)');
        } else if(user) {
          res.status(400).send('that email already has an account')
        } else {
          InviteCode.findOne({Email:recipientEmail}, function(error,foundCode) {
            if(error) {
              res.status(500).send('unable to process your request (check email)');
            } else if(foundCode) {
              res.status(400).send('that email already has an Invite Code');
            } else {
              var code = new InviteCode({Email: recipientEmail});
              code.save(function (err) {
                if (err) {
                  res.status(500).send("unable to process your request (createInvite)")
                } else {
                  emailController.SendInviteEmail(req, code, function(e, response) {
                    if(e) {
                      debug(e);
                      res.status(500).send('sorry email send failed');
                    } else {
                      res.status(200).send('sent invite');
                    }
                  });
                }
              });
            }
          })
        }
      });
    }
  } else {
    res.status(401).render('error', {message:"Unauthorized" ,error: new Error("Unauthorized")});
  }
});

router.get('/register', function(req, res) {
  var code = req.query.invitecode;
  if(!code || code==='') {
    res.status(400).send("not a valid invite code");
  } else {
    InviteCode.findOne({"InviteCode": code}, function (err, invite) {
      if (err || !invite) {
        res.status(500).send("could find your invite");
      } else if (invite.Redemed) {
        res.status(400).send("code already redeemed");
      } else if (invite.Expires < Date.now) {
        res.status(400).send('code expired');
      } else {
        res.render('register', {"InviteCode": invite});
      }
    });
  }
});

router.post('/register', function(req, res) {
  var invitecode = req.body.invitecode;
    if(invitecode) {
      InviteCode.findOne({InviteCode: invitecode}, function (err, foundCode) {
        if (err) {
          res.status(500).render('error',{message: err.message, error: err});
        } else if (!foundCode) {
          res.status(400).render('error',{message: "no invite code found", error: new Error("no invite code found")});
        } else {
          Account.register(new Account({username: req.body.username}), req.body.password, function (err, account) {
            if (err) {
              return res.render('register', {error: err,account: account});
            }
            foundCode.Redemed = true;
            foundCode.save(function(err) {
              if(err) {
                debug(err);
              }
            });
            passport.authenticate('local')(req, res, function () {
              res.redirect('/');
            });
          });
        }
      });
    } else {
      res.status(400).send('no invitecode sent');
    }
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

