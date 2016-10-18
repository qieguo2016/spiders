/**
 * Created by qieguo on 2016/8/25 0025.
 */

'use strict';

var express = require('express');
var router = express.Router();
var request = require('request');
var async = require('async');
var logger = require('../logger');


function renderPage(req, res, next) {
  res.render('lagou');
}

function fetchData(req, res, next) {

  const city = req.query.city || '北京';
  const kd = req.query.kd || '前端开发';
  const baseUrl = 'http://www.lagou.com/jobs/positionAjax.json?city=' + city + '&needAddtionalResult=false';

  let result = [];    // 结果数据
  let firstPage = {
    url     : baseUrl,
    formData: {
      first: "true",
      pn   : "1",
      kd   : kd
    }
  };

  logger.debug('----------  start fetch data  ----------');

  // 爬取第一页数据
  request.post(firstPage, function (err, sres) {

    if (err) {
      return logger.error('ERROR: ', err);
    }

    logger.debug('----------  fetch first page success!  ----------');

    let firstResult = JSON.parse(sres.body);
    result = result.concat(firstResult.content.positionResult.result);

    // 爬虫链接数据存放（按页爬取），页数根据第一次爬取结果定
    let pages = countPage(firstResult, baseUrl);

    // 开始爬取其他页面，控制最大并发数为5。
    async.mapLimit(pages, 5, function (page, callback) {
      // fetchUrl(page, callback);
      // 加点随机性，欺骗服务器
      var delay = parseInt((Math.random() * 30000000) % 2500, 10);
      setTimeout(function () {
        fetchUrl(page, callback);
      }, delay);
    }, function (err, fetchRes) {
      if (err) {
        return logger.error('ERROR: ', err);
      }
      logger.debug('----------  fetch all page success!  ----------');
      logger.debug('----------  finish!  ----------');
      res.send(result);
    });
  });


  // 计算页数
  function countPage(data, baseUrl) {
    let pages = [];
    let totalCount = data.content.positionResult.totalCount;     // 数据总条数
    let pageSize = data.content.positionResult.resultSize;         // 每页数据量
    let pageNum = Math.ceil(totalCount / pageSize);

    logger.debug('pageNum: ', pageNum);

    for (var i = 1; i <= pageNum; i++) {
      pages.push({
        url     : baseUrl,
        formData: {
          first: 'true',
          pn   : String(i),
          kd   : kd
        }
      });
    }
    return pages;
  }


  // 不利用callback函数返回结果。
  function fetchUrl(options, callback) {
    request.post(options, function (err, res) {
      if (err) {
        callback(err);
      }
      console.log('Fetch data success, page num: ', options.formData.pn);
      try {
        result = result.concat(JSON.parse(res.body).content.positionResult.result);
      } catch (e) {
        logger.error(e);
        callback(err);
      }
      callback(null, ' fetch data success! ');
    });
  }

}

module.exports = {
  renderPage: renderPage,
  fetchData : fetchData
};


