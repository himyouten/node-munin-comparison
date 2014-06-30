var site = require('./routes/site');
module.exports.load = function(app){
    // login
    // app.get('/login', login.show);
    // app.post('/login', login.process);
    // app.get('/login/fail', login.fail);

    // homepage
    app.all('/', site.homepage);

}