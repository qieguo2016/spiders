/**
 * Created by zhouyongjia on 2016/10/18.
 */
'use strict';

const logger = require('./logger');
const request = require('request');
const config = require('./config');

logger.debug('======  start spider  ======\r\n');

let baseUrl = 'https://www.baidu.com';
//request.get({
//  url  : baseUrl,
//  proxy: 'http://username:password@url:port'
//}, function (err, res, body) {
//
//});


//request.get({
//  url  : baseUrl,
//  proxy: config.proxy[0]
//}, function (err, res, body) {
//  if (err) {
//    return logger.error('err', err);
//  }
//  logger.debug('body', body);
//});

var http = require('http');

// make a request to a tunneling proxy
//var options = {
//  //  host   : config.proxy[0].host,
//  //  port   : config.proxy[0].port,
//  port    : config.proxy[0].port,
//  hostname: config.proxy[0].host,
//  method  : 'CONNECT',
//  path    : 'www.baidu.com'
//};
//
//var req = http.request(options);


var opt = {
  port    : config.proxy[1].port,
  hostname: config.proxy[1].host,
  //method : 'GET', //这里是发送的方法
  //method : 'GET',
  //host   : 'www.baidu.com',
  path    : 'www.baidu.com',     //这里是访问的路径
  headers : {
    //这里放期望发送出去的请求头
  }
}
//以下是接受数据的代码
var body = '';
var req = http.request(opt, function (res) {
  console.log("Got response: " + res.statusCode);
  res.on('data', function (d) {
    body += d;
  }).on('end', function () {
    console.log(res.headers)
    console.log(body)
  });

}).on('error', function (e) {
  console.log("Got error: " + e.message);
})
req.end();