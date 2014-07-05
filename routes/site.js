var logger = require('winston');

exports.homepage = function(req, res){
    logger.log("info","homepage rendered");
    res.render('index', {
      title: 'express-hbs example'
    });
}

exports.graph = function(req, res){
    logger.log("info","graph rendered");
    res.render('graph', {
      nav: {compare: 1},
      title: 'Compare'
    });
}