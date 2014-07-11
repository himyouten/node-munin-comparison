/**
datafile format:
vmp2;v2mq1:diskstats_iops.xvda3.avgwrrqsz.info Average Request Size in kilobytes (1000 based)
vmp2;v2mq1:diskstats_iops.xvda3.avgwrrqsz.update_rate 300
vmp2;v2mq1:diskstats_iops.xvda3.avgwrrqsz.draw LINE1
vmp2;v2mq1:diskstats_iops.xvda3.avgwrrqsz.min 0
vmp2;v2mq1:diskstats_iops.xvda3.avgwrrqsz.graph_data_size normal
vmp2;v2mq1:diskstats_iops.xvda3.avgwrrqsz.negative avgrdrqsz
vmp2;v2mq1:diskstats_iops.xvda3.avgwrrqsz.type GAUGE
vmp2;v2mq1:diskstats_iops.xvda3.avgwrrqsz.label Req Size (KB)

json format:
{
    vmp2: {
        'v2mq1-diskstats_iops-xvda3-avgwrrqsz': { 
            type: 'GAUGE',
            info: 'Average Request Size in kilobytes (1000 based)', 
            label: 'Req Size (KB)',
        },
    }
}

**/

var logger = require('winston');
var path = require('path');
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var lineRe = /^([^\;]+)\;([^\:]+)\:([^ ]+) (.+)$/g;
var cache = require('../config/cache.js');

var Datafile = function(datafile){
    logger.log("info", 'setting datafile:'+datafile);
    this.datafile = path.resolve(datafile);
    this._json = {_hosts: {} };
    this._selectopts = {};
    this.parseLine = function(line){
        // get the data from the file
        logger.log("debug", 'parsingLine:'+line);
        var data = line.split(' ');
        if (data.length == 0){
            logger.log("info", 'parsingLine skipping line, no space:'+line);
            return;
        }
        var metricArr = data.shift().split(/[\;|\:]/);
        if (metricArr.length < 2){
            logger.log("info", 'parsingLine skipping line, no enough metric parts:'+line);
            return;
        }
        var text = data.join(" ");
        var group = metricArr[0];
        var host = metricArr[1];
        var metricstat = metricArr[2].split('.');
        var stat = metricstat.pop();

        var graph = '';
        var metric = '';
        if (stat == 'graph_title'){
            graph = host+'-'+metricstat.join('-');
        } else {
            metric = metricstat.pop();
            graph = host+'-'+metricstat.join('-');
        }
        // only process info, type, label, graph_title
        logger.log("debug", 'group:%s metric:%s stat:%s text:%s', group, metric, stat, text);
        if (stat != 'info' && stat != 'type' && stat != 'label' && stat != 'graph_title'){
            logger.log("debug", 'parsingLine skipping type:'+stat);
            return;
        }
        // check if group exists in json
        if(typeof this._json[group] == 'undefined')
        {
            this._json[group] = {};
        }
        if(typeof this._json[group][host] == 'undefined')
        {
            this._json[group][host] = {};
            this._json._hosts[host] = group;
            logger.log('info', 'mapping host:%s to group:%s', host, group);
        }
        if (typeof this._json[group][host][graph] == 'undefined'){
            this._json[group][host][graph] = {host: host, title: '', metrics: {}};
        }
        if(metric.length > 0 && typeof this._json[group][host][graph].metrics[metric] == 'undefined')
        {
            this._json[group][host][graph].metrics[metric] = {info: '', type: '', label: ''};
        }
        switch (stat){
            case "graph_title":
                this._json[group][host][graph].title = text;
                break;
            case "info":
                this._json[group][host][graph].metrics[metric].info = text;
                break;
            case "type":
                this._json[group][host][graph].metrics[metric].type = text;
                break;
            case "label":
                this._json[group][host][graph].metrics[metric].label = text;
                break;
        }
        
        logger.log("debug", "parseLine:%s %s ", group, metric);
    };
    this.setSelectopts = function(){
        this._selectopts = { _all: [], _host: {} };
        for (group in this._json){
            this._selectopts._all.push({text: group.toUpperCase()});
            this._selectopts[group] = [];
            for (host in this._json[group]){
                this._selectopts._host[host] = [];
                for (graph in this._json[group][host]){
                    for (metric in this._json[group][host][graph].metrics){
                        var type = this._json[group][host][graph].metrics[metric].type;
                        if (type.length == 0){
                            // default to GAUGE if none found
                            type = 'g';
                        } else {
                            type = type.substring(0,1).toLowerCase();
                        }
                        var name = host + ' ' + this._json[group][host][graph].title + " "+metric;
                        var file = '/'+group+'/'+graph+'-'+metric+'-'+type+'.rrd';
                        this._selectopts._all.push({id: file, text: name});
                        this._selectopts[group].push({id: file, text: name});
                        this._selectopts._host[host].push({id: file, text: name});
                    }
                }
            }
        }
    };
    this.parse = function(selectopts, cb){
        logger.log('info', 'parsing datafie:%s', this.datafile);
        var instream = fs.createReadStream(this.datafile);
        var outstream = new stream;
        instream.on('error', function(e){ logger.log('error', 'error reading:%s %s', this.datafile, e) });
        var rl = readline.createInterface(instream, outstream);
        
        var datafileObj = this;
        rl.on('line', function(line){ datafileObj.parseLine(line) });

        rl.on('close', function() {
          logger.log("info", "finished loading:%s", datafileObj.datafile);
          // // set select opts
          datafileObj.setSelectopts();
          // update the cache
          cache.memory_cache.set('lib::munin-datafile::json::'+datafileObj.datafile, datafileObj._json);
          cache.memory_cache.set('lib::munin-datafile::selectopts::'+datafileObj.datafile, datafileObj._selectopts);
          if (cb != undefined){
              if (selectopts){
                  cb(null, datafileObj._selectopts);
              } else {
                  cb(null, datafileObj._json);
              }
          }
        });
        // if (cb != undefined){
        //     cb(null, datafileObj._json);
        // }
    };
    this.json = function (refresh, cb){
        if (refresh){
            logger.log('info', 'datafile:%s get json:forced', this.datafile);
            this.parse(false, cb);
            return;
        }
        var datafileObj = this;
        logger.log('info', 'datafile:%s get json:cached', this.datafile);
        cache.memory_cache.wrap('lib::munin-datafile::json::'+datafileObj.datafile, function (cache_callback) {
            logger.log('info', 'datafile:%s get json:cached miss', datafileObj.datafile);
            datafileObj.parse(false, cache_callback);
        }, cb);
    };
    this.selectopts = function (refresh, cb){
        if (refresh){
            logger.log('info', 'datafile:%s get selectopts:forced', this.datafile);
            this.parse(true, cb);
            return;
        }
        var datafileObj = this;
        logger.log('info', 'datafile:%s get selectopts:cached', this.datafile);
        cache.memory_cache.wrap('lib::munin-datafile::selectopts::'+datafileObj.datafile, function (cache_callback) {
            logger.log('info', 'datafile:%s get selectopts:cached miss', datafileObj.datafile);
            datafileObj.parse(true, cache_callback);
        }, cb);
    }
};

var getJson = function(datafile, refresh, cb){
    var datafile = new Datafile(datafile);
    datafile.json(refresh, cb);
}

var getSelectopts = function(datafile, refresh, cb){
    var datafile = new Datafile(datafile);
    datafile.selectopts(refresh, cb);
}

module.exports = Datafile;
module.exports.getJson = getJson;
module.exports.getSelectopts = getSelectopts;