/**
 * Created by abratin on 6/13/16.
 */

/**
 * Module dependencies.
 */

var env = require('dotenv').config({path: './.env'});
// var path = require('path');
var app = require('./app');
var debug = require('debug')('BratinPics:serverHTTPS');
var http = require('http');
var flikrController = require('./Controllers/Flicker_Controller');

/**
 * Create HTTP serverHTTPS.
 */

var httpPort = normalizePort(process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || '8080');
var ip = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var serverHTTP = http.createServer(app);

serverHTTP.listen(httpPort,ip);
flikrController.authenticateFlickr();


serverHTTP.on('error', function(error){
  onError(error,httpPort);
});
serverHTTP.on('listening', function(){
  onListening(serverHTTP);

});

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP serverHTTPS "error" event.
 */

function onError(error,port) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP serverHTTPS "listening" event.
 */

function onListening(server) {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
