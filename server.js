/**
 * Created by abratin on 6/13/16.
 */

/**
 * Module dependencies.
 */

// var path = require('path');
var app = require('./app');
var debug = require('debug')('BratinPics:serverHTTPS');
// var https = require('https');
var http = require('http');

// var fs = require('fs');
// var httpolyglot = require('httpolyglot');

/**
 * Create HTTP serverHTTPS.
 */

var httpPort = normalizePort(process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || '8080');
var ip = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var serverHTTP = http.createServer(app);
serverHTTP.listen(httpPort,ip);
serverHTTP.on('error', function(error){
  onError(error,httpPort);
});
serverHTTP.on('listening', function(){
  onListening(serverHTTP);
});

/**
 * Create HTTPS serverHTTPS.
 */
// var credentials = {key: process.env.HTTPS_PK, cert: process.env.HTTPS_CRT};

// var serverHTTPS = https.createServer(credentials,app);
// serverHTTPS.listen(httpsPort);
// serverHTTPS.on('error', function(error){
//   onError(error,httpsPort);
// });
// serverHTTPS.on('listening', function(){
//   onListening(serverHTTPS);
// });




// var httppolyglotServer = httpolyglot.createServer(credentials, function(req, res) {
//   if (!req.socket.encrypted) {
//     var redirectUrl = `https://${req.headers['host']}${req.url}`;
//     res.writeHead(301, { 'Location': redirectUrl});
//     return res.end();
//   }
//   return app(req,res);
// }).listen(port,ip);
//
// httppolyglotServer.on('listening', function(){
//    onListening(httppolyglotServer);
// });


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
