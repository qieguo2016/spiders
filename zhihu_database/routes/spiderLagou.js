/**
 * Created by qieguo on 2016/8/25 0025.
 */

'use strict';

var express = require('express');
var router = express.Router();
var request = require('request');
var async = require('async');

router.get('/', function (req, res, next) {
  res.render('lagou');
});

router.post('/', function (req, res, next) {

  var city = req.query.city || '北京';
  var kd = req.query.kd || '前端开发';
  var entraUrl = 'http://www.lagou.com/jobs/positionAjax.json?city=' + city + '&needAddtionalResult=false';

  var pages = [];      // 爬虫链接数据存放（按页爬取），页数根据第一次爬取结果定
  var result = [];    // 结果数据

  pages.push({
    url: entraUrl,
    formData: {
      first: "true",
      pn: "1",
      kd: kd
    }
  });

  console.log('server get a request: ', pages[0]);

  // 爬取第一页数据
  request.post(pages[0], function (err, sres) {

    if (err) return console.log(' ERROR!!! ', err);

    console.log('------------- fetch data success! ------------- ');

    result = result.concat(JSON.parse(sres.body).content.positionResult.result);
    // 计算页数
    countPage(JSON.parse(sres.body));

    // 开始爬取其他页面，控制最大并发数为5。
    async.mapLimit(pages.slice(1), 5, function (page, callback) {
      fetchUrl(page, callback);
      // 加点随机性，欺骗服务器
      //var delay = parseInt((Math.random() * 30000000) % 1000, 10);
      //setTimeout(function() {
      //    fetchUrl(page, callback);
      //}, delay);
    }, function (err, fetchRes) {
      console.log('--------------- send data ---------------');
      res.send(result);
    });
  });

  var countPage = function (data) {
    var totalCount = data.content.positionResult.totalCount;     // 数据总条数
    var pageSize = data.content.positionResult.pageSize;         // 每页数据量
    var pageNum = Math.ceil(totalCount / pageSize);
    for (var i = 2; i <= pageNum; i++) {
      pages.push({
        url: entraUrl,
        formData: {
          first: 'true',
          pn: String(i),
          kd: kd
        }
      });
    }
  };

  // 不利用callback函数返回结果。
  var fetchUrl = function (options, callback) {
    request.post(options, function (err, sres) {
      if (err) {
        callback(err, options + ' error happened!');
      }
      console.log('fetch data success! ');
      result = result.concat(JSON.parse(sres.body).content.positionResult.result);
      callback(null, ' fetch data success! ');
    });
  };

});

module.exports = router;
