var path = require('path');
var express = require('express');
var app = express();
var hbs = require('express-hbs');

// set up static
app.use("/public", express.static(__dirname + '/public'));

// Hook in express-hbs and tell it where known directories reside
var viewsDir = __dirname + '/views';
app.engine('hbs', hbs.express3({
    partialsDir: [__dirname + '/views/partials', __dirname + '/views/partials-other'],
    defaultLayout: __dirname + '/views/layout/default.hbs'
}));
app.set('view engine', 'hbs');
app.set('views', viewsDir);

module.exports = app;