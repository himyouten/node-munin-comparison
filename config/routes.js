var site = require('../routes/site');
var error = require('../routes/error');
var data = require('../routes/data');
module.exports.load = function(app){
    // app.param('rrdfile', /^[a-zA-Z0-9\-\.]+$/);

    // login
    // app.get('/login', login.show);
    // app.post('/login', login.process);
    // app.get('/login/fail', login.fail);

    // homepage
    app.all('/', site.homepage);
    app.all('/graph', site.graph);
    app.all(/^\/data\/rrd\/(.+)/, data.rrd);
    app.all('/data/dataopts/groups', data.datagroups);
    app.all('/data/dataopts/hosts/:group', data.datahosts);
    app.all('/data/dataopts/list/:host', data.dataopts);

    app.use(error.notFound);
    
    app.use(error.logErrors);
    app.use(error.clientErrorHandler);
    app.use(error.errorHandler);
}