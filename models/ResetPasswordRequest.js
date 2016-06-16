/**
 * Created by abratin on 6/14/16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');
var uuid = require('node-uuid');

var ResetPasswordRequestSchema = new Schema({
  ResetCode:{type: String, default: uuid.v1() },
  Email:String,
  Redemed:{type:Boolean, default: false},
  Issued: { type: Date, default: moment() },
  Expires: {type: Date, default: moment().add(1,'hour')}
});

module.exports = mongoose.model('ResetPasswordRequests', ResetPasswordRequestSchema);
