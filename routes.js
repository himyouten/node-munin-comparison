var site = require('./routes/site');
var error = require('./routes/error');
var rrd = require('./routes/rrd');
module.exports.load = function(app){
    // app.param('rrdfile', /^[a-zA-Z0-9\-\.]+$/);

    // login
    // app.get('/login', login.show);
    // app.post('/login', login.process);
    // app.get('/login/fail', login.fail);

    // homepage
    app.all('/', site.homepage);
    app.all('/graph', site.graph);
    app.all('/rrd/:rrdfile', rrd.info);
    app.all('/rrdtest/:rrdfile', function(req, res){ res.send({
        "data": [
          [
            "1401415200000",
            8.1167093355e+01
          ],
          [
            "1401422400000",
            7.0259408296e+01
          ],
          [
            "1401429600000",
            5.8622831799e+01
          ]
        ]
    }) });

    app.use(error.logErrors);
    app.use(error.clientErrorHandler);
    app.use(error.errorHandler);
}