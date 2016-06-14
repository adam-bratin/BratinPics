/**
 * Created by abratin on 6/11/16.
 */
var path = require('path');
var Image = require('../models/Image');
var fs = require('fs');
var debug = require('debug')('BratinPics:serverHTTPS');
var ExifImage = require('exif').ExifImage;


exports.saveImage = function(file,user, cb) {
    try {
        var orientation = 0;
        new ExifImage({ image : file.path }, function (error, exifData) {
            if (error) {

                debug(error);
            } else {
                orientation = exifData.image.Orientation;
            }

            var newPath = path.join(__dirname,'../imagesDB',`${file.filename}${path.extname(file.originalname)}`);
            fs.renameSync(file.path, newPath);
            var image = new Image({
                name: file.originalname,
                path: newPath,
                submitter: user,
                orientation: orientation
            });

            image.save(function(err) {
                if(err) {
                    debug(err);
                    cb(null);
                } else {
                    cb(image);
                }
            });
        });
    } catch (error) {
        console.log('Error: ' + error.message);
    }

};

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