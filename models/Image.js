/**
 * Created by abratin on 6/11/16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ImageSchema = new Schema({
    name: {type: String, default: ""},
    submitter: { ref: 'Accounts', type: Schema.Types.ObjectId },
    flickrId: {type:String, unique:true},
    flickrUrl: {type:String},
    flickrThumbnail: {type:String}
});


module.exports = mongoose.model('Images', ImageSchema);