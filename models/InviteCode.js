/**
 * Created by abratin on 6/9/16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');
var uuid = require('node-uuid');

var InviteCodeSchema = new Schema({
    InviteCode:{type: String, default: uuid.v1() },
    Email:String,
    Redemed:{type:Boolean, default: false},
    Issued: { type: Date, default: moment() },
    Expires: {type: Date, default: moment().add(365,'day')}
});

module.exports = mongoose.model('InviteCodes', InviteCodeSchema);
