/**
 * Created by abratin on 6/17/16.
 */
var Flickr = require("flickrapi"),
  fs = require("fs"),
  path = require('path'),
  debug = require('debug')('BratinPics:serverHTTPS'),
  constants = require('../public/Constants'),
  OauthToken = require('../models/OauthToken'),
  imageController = require('./Image_Controller'),
  flickrUrlShort = require('../libs/flickr-shorturl'),
  flickrClient = null,
  flickrOptions = null;

//<editor-fold desc="authentication">
exports.authenticateFlickr = function() {
  return new Promise((resolve,reject)=>{
    try {
      getFilckrOauthToken(process.env.FLICKR_USER_ID)
      .then(generateFlickrOptions)
      .then(authenticate)
      .then(saveFlikrOauthToken)
      .catch(reject);
    } catch (error) {
      debug(error);
      var serverError = constants.StatusCodes.serverError;
      reject(serverError);
    }
  });
};

exports.handleFlikrOauthRequest = function (req,res) {
  flickrOptions.exchange(req.query);
  res.status(200).send("ok");
};

function authenticate(options) {
  return new Promise((resolve,reject)=> {
    try {
      flickrOptions = options;
      Flickr.authenticate(flickrOptions,(err,flickr)=> {
        if(err) {
          debug(err);
          var serverError = constants.StatusCodes.serverError;
          reject(serverError);
        } else {
          flickrClient = flickr;
          resolve(flickr.options);
        }
      });
    } catch(error) {
      debug(error);
      var serverError = constants.StatusCodes.serverError;
      reject(serverError);
    }
  });
}

function saveFlikrOauthToken(tokens){
  return new Promise((resolve,reject)=> {
    try {
      var update = {
        $set: {
          access_token: tokens.access_token,
          access_token_secret: tokens.access_token_secret,
          oauth_nonce: tokens.oauth_nonce,
          oauth_verifier: tokens.oauth_verifier
        }
      },
      query = {
        provider:"Flickr",
        username:tokens.user_id
      },
      options = {
        new:true,
        upsert:true
      };
      OauthToken.findOneAndUpdate(query,update,options,function(err,oAuthToken) {
          if (err) {
            debug(err );
            var serverError = constants.StatusCodes.serverError;
            reject(serverError);
          } else {
            resolve(oAuthToken);
          }
      });
    } catch (error) {
      debug(error);
      var serverError = constants.StatusCodes.serverError;
      reject(serverError);
    }
  });
}



function getFilckrOauthToken(username) {
  return new Promise((resolve)=>{
    try {
      OauthToken.findOne({provider: "Flickr", username:username || ''}, function (err, oauthToken) {
        if(err) {
          debug(err);
          resolve(null);
        } else {
          resolve(oauthToken);
        }
      });
    } catch(error) {
      debug(error);
      resolve(null);
    }
  });
}

function generateFlickrOptions(oAuthToken) {
  return new Promise(resolve=> {
    var flickrOptions = {};
    try {
      var stack = process.env.STACK || "",
        localHostCallback = `http://localhost:${process.env.PORT || '8080'}/handleFlickrAuth`,
        remoteHostCallback = `https://${process.env.OPENSHIFT_GEAR_DNS}:${process.env.PORT || '8080'}/handleFlickrAuth`,
        flickrOptions = {
          api_key: process.env.FLICKR_CONSUMER_KEY,
          secret: process.env.FLICKR_CONSUMER_SECRET,
          permissions: "delete",
          callback: `${stack === 'Debug' ? localHostCallback : remoteHostCallback}`,
          force_auth: true,
          retry_queries: true,
          // console.logs the auth URL instead of opening a browser for it.
          nobrowser: true,
        };
      if(oAuthToken && oAuthToken.username) {
        flickrOptions.user_id = oAuthToken.username;
      } else {
        flickrOptions.user_id = process.env.FLICKR_USER_ID
      }
      if(oAuthToken && oAuthToken.oauth_verifier) {
        flickrOptions.oauth_verifier = oAuthToken.oauth_verifier;
      }
      if (oAuthToken && oAuthToken.access_token) {
        flickrOptions.access_token = oAuthToken.access_token;
      }
      if (oAuthToken && oAuthToken.access_token_secret) {
        flickrOptions.access_token_secret = oAuthToken.access_token_secret;
      }
      if (oAuthToken && oAuthToken.oauth_nonce) {
        flickrOptions.oauth_nonce = oAuthToken.oauth_nonce;
      }
    } catch (err) {
      debug(error);
    }
    resolve(flickrOptions);
  });
}
//</editor-fold>

//<editor-fold desc="APIs">
exports.HandleFilesUploadToFlickr = function (req, res) {
  var photos = req.files.map((file)=> {
    return prepareFileForUploadToFlickr(file,req.user);
  });
  uploadToFlickr(photos)
  .then(getFlickrPhotoInfo)
  .then(function(photos) {
    var dbImages = photos.map(function(photo){
      return saveFlickrPhotoToDb(photo.photo,req.user,photos);
    });
    return Promise.all(dbImages);
  })
  .then(function(dbPhotos) {
    dbPhotos.filter(function (val) {
      return val !== null;
    });
    req.files.forEach(function(upload) {
      fs.unlinkSync(`${upload.path}${path.extname(upload.originalname)}`);
    });
    res.status(200).json({
      photos: dbPhotos
    });
  }).catch(function(error){
    res.status(error.code || 500).send(status);
  });
};

function prepareFileForUploadToFlickr(file, submitter) {
  var newPath = file.path+path.extname(file.originalname);
  fs.renameSync(file.path,newPath);
  return {
    title: file.originalname,
    tags: [
      `submitter:${submitter.username}`
    ],
    is_public:0,
    photo: newPath
  }
}

function uploadToFlickr(photos) {
  return new Promise((resolve,reject)=> {
    try {
      Flickr.upload({photos:photos}, flickrOptions, function(err, results) {
        if(err) {
          debug(err);
          var serverError = constants.StatusCodes.serverError;
          reject(serverError);
        } else {
          resolve(results);
        }
      });
    } catch(error) {
      debug(error);
      var serverError = constants.StatusCodes.serverError;
      reject(serverError);
    }
  });
}

function getFlickrPhotoInfo(photoId) {
  return new Promise((resolve,reject)=> {
    try {
      if(Array.isArray(photoId)) {
        var photosInfo = photoId.map(getFlickrPhotoInfo);
        Promise.all(photosInfo)
        .then(resolve)
        .catch(reject);
      } else {
        flickrClient.photos.getInfo({photo_id: photoId}, function (err, results) {
          if (err) {
            debug(err);
            var serverError = constants.StatusCodes.serverError;
            reject(serverError);
          } else {
            resolve(results);
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

function saveFlickrPhotoToDb(photo,user, reqFiles) {
  return new Promise((resolve) => {
    try {
      var flickrUrl = `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}.jpg`;
      var flickrUrlThumbnail = `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_t.jpg`;
      var dbPhoto = {
        name: photo.title._content,
        submitter: user,
        flickrId: photo.id,
        flickrUrl: flickrUrl,
        flickrThumbnail: flickrUrlThumbnail
      };
      imageController.saveImageToDb(dbPhoto)
      .then(resolve)
      .catch(error =>{
        resolve(null);
      })
    } catch(error) {
      debug(error);
      resolve(null);
    }
  });
}

exports.getPhotosBySubmitter = function (user,page) {
  return new Promise((resolve, reject)=>{
    try {
      flickrClient.photos.search({
        user_id: flickrClient.options.user_id,
        tags: user.username,
        page: page,
        per_page: 100,
        privacy_filter: 5
      }, function(err, results) {
        if(err) {
          debug(err);
          reject(err);
          return results.map(function(photo) {
            mapFlickrPhotoToDb(photo)
            .then(function(dbPhoto){
              var imageJson = createImageJsonReturn(dbPhoto,photo);
              if(imageJson.submitter && imageJson.imgUrl) {
                resolve(imageJson);
              }
            });
          });
        }
      });
    } catch (error) {
      debug(error);
      var serverError = constants.StatusCodes.serverError;
      reject(serverError);
    }
  })
};

function flickrPhotoSearch(options) {
  return new Promise((resolve,reject)=> {

    try {
      if (flickrClient) {
        flickrClient.photos.search(options, function (err, results) {
          if (err) {
            debug(err);
            reject(err);
          } else {
            resolve(results);
          }
        });
      } else {
        debug("Flikr not Authenticated");
      }
    } catch (error) {
      debug(error);
      reject(error);
    }
  });
}

function mapFlickrPhotoToDb(photo) {
  return new Promise((resolve, reject) =>{
    try {
      imageController.retrieveImageByFlickrId(photo.id)
      .then(resolve)
      .catch(reject);
    } catch(error) {
      debug(error);
    }
  });
}

function createImageJsonReturn(fPhoto, dbPhoto) {
  try {
    return {
      submitter:dbPhoto.submitter,
      imgUrl: `https://farm${fPhoto["farm-id"]}.staticflickr.com/${fPhoto["server-id"]}/${fPhoto["id"]}_${fPhoto.secret}_t.jpg`
    }
  } catch(err) {
    debug(err);
    return {};
  }
}
//</editor-fold>