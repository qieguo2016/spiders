/**
 * Created by zhouyongjia on 2016/10/18.
 */
'use strict';

var http = require('http');
var net = require('net');
var url = require('url');

function request(cReq, cRes) {
  var u = url.parse(cReq.url);

  var options = {
    hostname : u.hostname,
    port     : u.port || 80,
    path     : u.path,
    method     : cReq.method,
    headers     : cReq.headers
  };

  var pReq = http.request(options, function(pRes) {
    cRes.writeHead(pRes.statusCode, pRes.headers);
    pRes.pipe(cRes);
  }).on('error', function(e) {
    cRes.end();
  });

  cReq.pipe(pReq);
}

http.createServer().on('request', request).listen(8888, '0.0.0.0');