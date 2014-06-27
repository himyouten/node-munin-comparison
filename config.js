var DEFAULTS = {
    'http': { 'port': 8080 },
    'logging' : { 
        'console': {'level': 'debug'}, 
        'file': {'level': 'info'} 
    }
}

var nconf = require('nconf');
var yaml = require('js-yaml')
var fs   = require('fs');
var logger = require('winston');
  
// First consider commandline arguments and environment variables, respectively.
nconf.argv().env()
var conf_file = nconf.get("CONF_FILE");

// if config file passed, check if yaml, default to json
if (conf_file != undefined && conf_file.length > 0) {
    if (conf_file.substr(conf_file.length-4) == ".yml"){
        // Get document, or throw exception on error
        try {
          var doc = yaml.safeLoad(fs.readFileSync(conf_file, 'utf8'));
          nconf.overrides(doc);
        } catch (e) {
            logger.log("error", e);
        }
    } else {
        nconf.file(nconf.get("CONF_FILE"));
    }
}

// Provide default values for settings not provided above.
nconf.defaults(DEFAULTS);

module.exports = nconf;
