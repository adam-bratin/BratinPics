/**
 * Created by abratin on 6/11/16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ImageSchema = new Schema({
    name: {type: String, default: ""},
    path : {type: String, default: '../images/'},
    submitter: { ref: 'Accounts', type: Schema.Types.ObjectId },
    orientation: {type:Number, default: 0}
});


module.exports = mongoose.model('Images', ImageSchema);