var debug = require('debug')('BratinPics:serverHTTPS');
var path = require('path');
var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const mongoose = require('mongoose');
var session = require('express-session');
const MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var routes = require('./routes/index');
var helmet = require('helmet');

var app = express();

var mongodbUrl = '127.0.0.1:27017/' + "passport_local_mongoose_express4";

// if OPENSHIFT env variables are present, use the available connection info:
if (process.env.OPENSHIFT_MONGODB_DB_URL) {
  mongodbUrl = process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME;
}
// Connect to mongodb
mongoose.connect(mongodbUrl);

var db = mongoose.connection;
db.on('error', function(error){
  console.log("Error loading the db - "+ error);
});

db.on('disconnected', function(){
  connect(mongodbUrl);
});

db.on('open', function(){
  debug(`connected to: ${mongodbUrl}`);
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));

app.use(helmet());

//redirect http traffic to https traffic
app.use(function(req,res,next) {
  var stack = process.env.STACK || "";
  if(stack !== 'Debug') {
    if(req.headers['x-forwarded-proto'] === 'https') {
      next();
    } else {
      res.redirect(`https://${req.hostname}${req.url}`)
    }
  } else {
    next();
  }
});

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.set('trust proxy', 1); // trust first proxy

app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 14 * 24 * 60 * 60,
    autoRemove: 'disabled',
    touchAfter: 24 * 3600
  })
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// passport config
var Account = require('./models/Account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

app.use(function(req, res, next){
  if(req.url.indexOf('imagesDB')==-1) {
    next();
  } else if(!req.isAuthenticated()){
    res.status(401).render('error', {message:'unauthorized', error:new Error("unauthorized")});
  } else {
    var request = url.parse(req.url, true);
    var resourcePath = path.join(__dirname, request.pathname);
    res.sendFile(resourcePath);
  }

});

app.use('/', routes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
