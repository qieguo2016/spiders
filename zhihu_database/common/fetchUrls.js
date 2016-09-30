/**
 * Created by qieguo on 2016/8/25 0025.
 */

'use strict';

var request = require("request");
var cheerio = require("cheerio");
var async = require('async');
var userAgent = require('./spider.config.js').userAgent.win;

var models = require('./../models/index');
var TopicTitle = models.TopicTitle;

// 爬帖子title、href、lastmodified
var concurrencyCount = 0;
function fetchUrl(opt, callback) {
  concurrencyCount++;
  console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', opt.url);
  request(opt, function (error, response, body) {
    if (error) {
      return callback(error);
    }
    var $ = cheerio.load(body, {
      normalizeWhitespace: true,
      decodeEntities: false
    });
    saveDataSet($);
    concurrencyCount--;
    console.log('fetch url success,', opt.url);
    callback();
  });
}

// 保存数据
function saveDataSet($) {
  var items = [];
  var year = new Date().getFullYear() + '-';
  $('.olt tr').slice(1).each(function (index, el) {
    var $item = $('.title > a', el);
    var $author = $('td', el).eq(1).children();
    var topicId = /topic\/(\w+)\/$/.exec($item.attr('href'));
    var authorId = /people\/(\w+)\/$/.exec($author.attr('href'));
    items.push({
      title: $item.attr('title'),
      topic_id: topicId ? topicId[1] : $item.attr('href'),
      author: {
        id: authorId ? authorId[1] : $author.attr('href'),
        name: $author.text()
      },
      reply_count: $('td', el).eq(2).text(),
      last_reply_at: new Date(year + $('.time', el).text()),
      tags: []
    });
  });

  TopicTitle.create(items, function (err) {
    if (err) {
      return console.log(err);
    }
    // saved!
  })
}

/**
 * 请求参数初始化
 * @param: urls:请求的url、 opts：请求header参数， num：爬取的页数
 */
function initRequestOpt(urls, num) {
  var opts = [];
  urls.forEach(function (url) {
    for (var i = 0; i < num; i++) {
      opts.push({
        method: 'GET',
        url: url + '?start=' + (i * 25).toString(),
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'cache-control': 'no-cache',
          'http-only': true,
          'user-agent': userAgent
        }
      });
    }
  });
  return opts;
}

/**
 * 关键词筛选
 * @param: str:被筛选的字符串、 words：正则表达式参数（数组）
 * @return: true:包含所有关键词、 false:不全包含给出的关键词
 */
function checkIncludeWords(str, words) {
  var result = words.every(function (word) {
    return new RegExp(word, 'g').test(str);
  });
  return result;
}

/**
 * 关键词排除
 * @param: str:被筛选的字符串、 words：正则表达式参数（数组）
 * @return: true:不包含任一关键词、 false:包含给出的关键词
 */
function checkExcludeWords(str, words) {
  var result = words.some(function (word) {
    return new RegExp(word, 'g').test(str);
  });
  return !result;
}

/**
 * 控制请求的并发为5，完成数据爬取
 * @params: baseUrls:[], num: 请求数, daysAgo: 在此之前的数据不爬
 * @return: 爬取的结果
 * */
module.exports = function (baseUrls, num, cb) {
  var opts = initRequestOpt(baseUrls, num);
  async.eachLimit(opts, 5, function (opt, callback) {
    fetchUrl(opt, callback);
  }, function (err) {
    if (err) {
      console.log('fetchUrl Error: ', err);
      return cb(err);
    }
    console.log('finish fetchUrl!');
    cb(null);
  });
};