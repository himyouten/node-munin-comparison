var config = require('./config');
var logger = require('./log')(config);

var app = require('express')();
var server = require('http').Server(app);
// var io = require('socket.io')(server);
logger.log("debug","Starting on port:"+config.get('http:port'));

server.listen(config.get('http:port'));
var routes = require('./routes').load(app);

// io.on('connection', function (socket) {
//   socket.emit('news', { hello: 'world' });
//   socket.on('my other event', function (data) {
//     console.log(data);
//   });
// });