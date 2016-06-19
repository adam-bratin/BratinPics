/**
 * Created by abratin on 6/17/16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OauthTokenSchema = new Schema({
  provider:String,
  username:{type:String, unique:true},
  refresh_token:String,
  access_token:String,
  access_token_secret:String,
  oauth_nonce:String,
  oauth_verifier:String
});

module.exports = mongoose.model('OauthTokens', OauthTokenSchema);
