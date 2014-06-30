var logger = require('winston');

exports.homepage = function(req, res){
    logger.log("info","homepage rendered");
    res.render('index', {
      title: 'express-hbs example hello craig!'
    });
}