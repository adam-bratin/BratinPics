/**
 * Created by abratin on 6/11/16.
 */
var path = require('path');
var Image = require('../models/Image');
var fs = require('fs');
var debug = require('debug')('BratinPics:serverHTTPS');
var ExifImage = require('exif').ExifImage;
var constants = require('../public/Constants');

exports.saveImages = function(req,res) {
    try {
        if (req.files.length < 1) {
            var noFilesUploaded = constants.StatusCodes.noFilesUploaded;
            res.status(noFilesUploaded.code).send(noFilesUploaded.status);
        } else {
            var savedFiles = [];
            var saveResults = req.files.map((file) => {
                return saveImage(file, req.user);
            });
            Promise.all(saveResults)
            .then((images) => {
                for (var i in images) {
                    var image = images[i];
                    if (image) {
                        savedFiles.push(image.name);
                    }
                }
                res.status(200).json({
                    filesSaved: savedFiles
                });
            }).catch(error=> {
              debug(error);
                var serverError = constants.StatusCodes.serverError;
                res.status(serverError.code).send(serverError.status);
            });
        }
    } catch(error) {
        debug(error);
        var serverError = constants.StatusCodes.serverError;
        res.status(serverError.code).send(serverError.status);
    }
};

function saveImage(file,user) {
    return new Promise((resolve)=> {
        try {
            var orientation = 0;
            getExifData(path)
            .then(function (calculatedOrientation) {
                orientation = calculatedOrientation;
                return renameFile(file);
            })
            .then(function(newPath){
                return saveImageToDb(file,newPath,orientation,user);
            })
            .then(resolve)
            .catch((error)=> {
                debug(error);
                resolve(null);
            });

        } catch (error) {
            debug(error);
            // var serverError = constants.StatusCodes.serverError;
            // reject(serverError);
            resolve(null);
        }
    });
};

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

function renameFile(file) {
    return new Promise((resolve, reject)=> {
        try {
            var newPath = path.join(__dirname, '../imagesDB',
              `${file.filename}${path.extname(file.originalname)}`);
            fs.rename(file.path, newPath, function (error) {
                if (error) {
                    debug(error);
                    var serverError = constants.StatusCodes.serverError;
                    reject(serverError);
                } else {
                    resolve(newPath);
                }
            });
        } catch (err) {
            debug(err);
            var serverError = constants.StatusCodes.serverError;
            reject(serverError);
        }
    });
}

function saveImageToDb(file,orientation,user) {
    return new Promise((resolve,reject)=>{
      try{
          var image = new Image({
              name: file.originalname,
              path: newPath,
              submitter: user,
              orientation: orientation
          });
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