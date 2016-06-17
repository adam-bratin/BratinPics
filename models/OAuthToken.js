/**
 * Created by abratin on 6/15/16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment=require('moment');

var OAuthTokenSchema = new Schema({
  Provider : String,
  username : {type:String, required: true, unique: true},
  Access_token: String,
  Refresh_token: String,
  Expires : {type:Date, default:moment()}
});


module.exports = mongoose.model('OAuthTokens', OAuthTokenSchema);