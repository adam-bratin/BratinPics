/**
 * Created by abratin on 6/15/16.
 */
var imageController = require('../Controllers/Image_Controller');
var constants = require('../public/Constants');
exports.HandleFilesUpload = function(res,req) {
  try {
    if(req.files.length<1) {
      var noFilesUploaded = constants.StatusCodes.noFilesUploaded;
      res.status(noFilesUploaded.code).send(noFilesUploaded.status);
    } else {
      var savedFiles = [];
      var requests = req.files.map((item) => {
        return new Promise((resolve) => {
          imageController.saveImage(item, req.user, resolve);
        });
      });
      Promise.all(requests)
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
        })
        .catch(error=> {
          res.status(error.code).send(error.status);
        });
    }
  } catch (error) {
    debug(error);
    res.status(500).send('could not upload files');
  }
};