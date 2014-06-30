var path = require('path');
var config = require('./config');
var logger = require('./log')(config);

// load express hbs templates
var app = require('./express-hbs');

// load routes
var routes = require('./routes').load(app);

// start the server
var server = require('http').Server(app);
logger.log("debug","Starting on port:"+config.get('http:port'));
server.listen(config.get('http:port'));

// var io = require('socket.io')(server);
// io.on('connection', function (socket) {
//   socket.emit('news', { hello: 'world' });
//   socket.on('my other event', function (data) {
//     console.log(data);
//   });
// });