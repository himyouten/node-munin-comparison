var logger = require('winston');
var config = require('../config');

exports.homepage = function(req, res){
    logger.log("info","test");
    res.end("hello");
}