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
var RRD = require('rrd').RRD;

var rrd, rrdTime;

rrdTime = function(date) {
  return Math.round(date.valueOf() / 1000);
};

jsTime = function(epoch) {
    return epoch * 1000;
}

exports.info = function(req, res){
    res.set("Connection", "close");
    var rrd = new RRD('./datafiles/'+req.params.rrdfile);
    var startTime = 1401408000;
    var endTime = 1402444800;
    logger.log("info", "start: %s end:%s", startTime, endTime);
    rrd.fetch(startTime, endTime, function(err, results) {
      if (err) {
        logger.log("error", "error fetching %s: %s", req.params.rrdfile, err);
      } else {
        logger.log("info", "result for %s:", req.params.rrdfile);
        var seriesdata = [];
        for (i = 0; i < results.length; i++){
            seriesdata.push([jsTime(results[i]['timestamp']), results[i]['42']]);
        }
        var series = { 'label': req.params.rrdfile, 'data': seriesdata  };
        res.send(200,series);
        res.end();
        logger.log("info", "cb finished");
      }
      // return;
    });
    logger.log("info", "finished");
    // return;
}