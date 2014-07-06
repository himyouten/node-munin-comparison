var logger = require('winston');
var datafile = require('../lib/munin-datafile');

exports.homepage = function(req, res){
    logger.log("info","homepage rendered");
    res.render('index', {
      title: 'Goaf Munin Comparison',
      lead: 'Compare Munin graphs interactively!'
    });
}

exports.graph = function(req, res){
    logger.log("info","graph rendered");
    res.render('graph', {
      nav: {compare: 1},
      title: 'Compare'
    });
}