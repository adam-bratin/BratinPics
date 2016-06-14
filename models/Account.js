/**
 * Created by abratin on 6/9/16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var AccountSchema = new Schema({
    username: String,
    password: String
});

AccountSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Accounts', AccountSchema);