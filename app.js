var path = require('path');
var config = require('./config/config');
var logger = require('./config/log')(config);

// load express hbs templates
var app = require('./config/express-hbs');

// load routes
var routes = require('./config/routes').load(app);

// load the datafile
var Datafile = require('./lib/munin-datafile');
var datafile = new Datafile('./datafiles/datafile');
datafile.parse();

app.set('datafileJson', datafile.json);

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