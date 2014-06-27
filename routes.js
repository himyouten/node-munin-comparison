var main = require('./routes/main');
module.exports.load = function(app){
    app.get('/', main.homepage);
}