/**
data json format:
{
"label": "series title",
"data": [ [x,y],... ]
}

munin rrd data format:
[
{
"42": "8.1167093355e+01",
"timestamp": "1401415200",
"fieldNames": [
"42"
]
},
{
"42": "7.0259408296e+01",
"timestamp": "1401422400",
"fieldNames": [
"42"
]
},

**/
var logger = require('winston');
var fs = require('fs');
var RRD = require('rrd').RRD;
var Datafile = require('../lib/munin-datafile');
var config = require('../config/config');

var rrdUtils = {
    timeRanges : {
        d: {val: 1, type: "d"},
        w: {val: 7, type: "d"},
        m: {val: 1, type: "m"},
        y: {val: 1, type: "y"},
    },
    getRrdTime: function(date) {
      return Math.round(date.valueOf() / 1000);
    },

    getJsTime: function(epoch) {
        return epoch * 1000;
    },

    getEndDate: function(dateStr){
        if (dateStr != undefined && dateStr.length > 0){
            return Date.parse(endDateStr);
        }
        return new Date();
    },

    getStartDate: function(dateStr, endDate, timeValue, timeInterval){
        if (dateStr != undefined && dateStr.length > 0){
            return Date.parse(dateStr);
        }
        logger.log("info", "getStartDate:%s, %s - %s%s ago", dateStr, endDate, timeValue, timeInterval);
        var startDate = new Date(endDate);
        switch (timeInterval){
            case "y": 
                logger.log("info", "getStartDate: year:%s", startDate.getYear());
                
                return startDate.setYear(startDate.getYear() - timeValue + 1900);
            case "m": 
                return startDate.setMonth(startDate.getMonth() - timeValue);
            case "d": 
                return startDate.setDate(startDate.getDate() - timeValue);
            case "h": 
                return startDate.setTime(startDate.setTime() - timeValue * 3600);
            case "M": 
                return startDate.setTime(startDate.setTime() - timeValue * 60);
            case "s": 
                return startDate.setTime(startDate.getTime() - timeValue);
            logger.log("info", "getStartDate - cannot find timeInterval: %s", timeInterval);
        }
    },
    
    getTimeRange: function(key){
        if (key == undefined || key.length == 0 || !key in this.timeRanges){
            key = "d";
        }
        return this.timeRanges[key];
    }
}

var rrd = function(req,res){
    var rrdfile = config.get('datafiles')+'/'+req.params[0];
    fs.exists(config.get('datafiles')+'/'+req.params[0], function(exists){
        if (exists){
            fetchRRD(req, res);
        } else {
            res.send(400, {error: 'none found'});
        }
    })
}

var fetchRRD = function(req, res){
    var rrd = new RRD(config.get('datafiles')+'/'+req.params[0]);
    logger.log("info", "rrd:%s", req.params[0]);
    var timeRange = rrdUtils.getTimeRange(req.query['timeRange']);
    var endDate = rrdUtils.getEndDate(req.query['startdatetime']);
    var startDate = rrdUtils.getStartDate(req.query['startdatetime'], endDate, timeRange.val, timeRange.type);
    
    logger.log("info", "timeRange:%s startDate:%s endDate:%s", timeRange, startDate.toString(), endDate.toString());
    var endTime = rrdUtils.getRrdTime(endDate);
    var startTime = rrdUtils.getRrdTime(startDate);
    
    logger.log("info", "start: %s end:%s", startTime, endTime);
    rrd.fetch(startTime, endTime, function(err, results) {
      if (err) {
        logger.log("error", "error fetching %s: %s", req.params[0], err);
      } else {
        logger.log("info", "result for %s:", req.params[0]);
        var seriesdata = [];
        for (i = 0; i < results.length; i++){
            seriesdata.push([rrdUtils.getJsTime(results[i]['timestamp']), results[i]['42']]);
        }
        var series = { 'label': req.params[0], 'data': seriesdata  };
        res.send(200,series);
        res.end();
        logger.log("info", "cb finished");
      }
      // return;
    });
    logger.log("info", "finished");
    // return;
}

var datagroups = function(req, res){
    Datafile.getJson(config.get('datafiles')+'/datafile', false, function(err, result){
        var groups = [];
        var keys = Object.keys(result);
        for (var i = 0; i < keys.length; i++) {
            if (keys[i].substring(0,1) == "_"){
                continue;
            }
            groups.push(keys[i]);
        }        
        res.send(groups);
    })
}

var datahosts = function(req, res){
    Datafile.getJson(config.get('datafiles')+'/datafile', false, function(err, result){
        // get all hosts
        if (req.params.group == '_all'){
            var allhosts = [];
            for (group in result){
                var hosts = Object.keys(result[group]);
                allhosts = allhosts.concat(hosts);
            }
            // get uniques
            allhosts = allhosts.filter(function(itm,i,a){
                return i==a.indexOf(itm);
            });
            res.send(allhosts);
        } else {
            res.send(Object.keys(result[req.params.group]));
        }
    })
}

var dataopts = function(req, res){
    logger.log('info','base datafiles:%s',config.get('datafiles'));
    if (req.query.format == 'selectopts'){
        Datafile.getSelectopts(config.get('datafiles')+'/datafile', false, function(err, result){
            res.send(result._host[req.params.host]);
        })
    } else {
        Datafile.getJson(config.get('datafiles')+'/datafile', false, function(err, result){
            var group = result._hosts[req.params.host];
            logger.log('info', 'group:%s for %s', group, req.params.host);
            if (group != undefined && group.length > 0){
                res.send(result[group][req.params.host]);
            } else {
                logger.log('info', 'host:%s not found', req.params.host);
                res.send(400, {error: 'none found'});
            }
        })
    }
}

var dataoptsByGroup = function(req, res){
    logger.log('info','base datafiles:%s',config.get('datafiles'));
    if (req.query.format == 'selectopts'){
        Datafile.getSelectopts(config.get('datafiles')+'/datafile', false, function(err, result){
            res.send(result[req.params.group]);
        })
    } else {
        Datafile.getJson(config.get('datafiles')+'/datafile', false, function(err, result){
            res.send(result[req.params.group]);
        })
    }
}

exports.rrdUtils = rrdUtils;
exports.rrd = rrd;
exports.dataopts = dataopts;
exports.datagroups = datagroups;
exports.datahosts = datahosts;