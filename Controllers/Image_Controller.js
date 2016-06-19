/**
 * Created by abratin on 6/11/16.
 */
var path = require('path');
var Image = require('../models/Image');
var fs = require('fs');
var debug = require('debug')('BratinPics:serverHTTPS');
var ExifImage = require('exif').ExifImage;
var constants = require('../public/Constants');


function getExifData(path) {
    return new Promise((resolve,reject)=>{
        try{
            new ExifImage({image: path}, function (error, exifData) {
                if (error) {
                    debug(error);
                    var serverError = constants.StatusCodes.serverError;
                    reject(serverError);
                } else {
                    resolve(exifData.image.Orientation);
                }
            });
        } catch(error) {
            debug(error);
            var serverError = constants.StatusCodes.serverError;
            reject(serverError);
        }
    });
}

exports.saveImageToDb = function (photo) {
    return new Promise((resolve,reject)=>{
      try{
          var image = new Image(photo);
          image.save(function (err) {
              if (err) {
                  debug(err);
                  var serverError = constants.StatusCodes.serverError;
                  reject(serverError);
              } else {
                  resolve(image);
              }
          });
      } catch(error) {
          debug(error);
          var serverError = constants.StatusCodes.serverError;
          reject(serverError);
      }
    });
};

exports.retrieveImageByFlickrId = function (id) {
  return new Promise((resolve,reject)=>{
      try {
          Image.findOne({flickrId: id}, function(err, image) {
              if(err) {
                  debug(err);
              }
              if(err || ! image) {
                  var serverError = constants.StatusCodes.serverError;
                  reject(serverError);
              } else {
                  resolve(image);
              }
          })
      } catch(error) {
          debug(error);
          var serverError = constants.StatusCodes.serverError;
          reject(serverError);
      }
  })
};

exports.findAllImages = function() {
    return new Promise(resolve=> {
        try {
            Image.find({}, function (err, images) {
                if(err) {
                    debug(err);
                }

                resolve(images);
            })
        } catch(error) {
            debug(error);
            resolve(null);
        }
    })
}

exports.findImagesBySubmitter = function (user) {
  return new Promise(resolve=>{
      Image.find({submitter:user},function(err,images) {
          if(err){
              debug(err);
          }
          resolve(images);
      });
  });
};