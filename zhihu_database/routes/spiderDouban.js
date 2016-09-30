/**
 * Created by qieguo on 2016/8/25 0025.
 */

'use strict';

var express = require('express');
var router = express.Router();
var request = require("request");
var cheerio = require("cheerio");
var eventproxy = require('eventproxy');
var ep = new eventproxy();
var async = require('async');

var pageNum = 1, szRequestOpts = [], bjRequestOpts = [];
var szUrls = [
  'https://www.douban.com/group/106955/discussion',
  'https://www.douban.com/group/nanshanzufang/discussion'
];
var bjUrls = [
  'https://www.douban.com/group/fangzi/discussion',
  'https://www.douban.com/group/26926/discussion',
  'https://www.douban.com/group/beijingzufang/discussion',
  'https://www.douban.com/group/279962/discussion'
];

initRequestOpt(szUrls, szRequestOpts, pageNum);
initRequestOpt(bjUrls, bjRequestOpts, pageNum);

// 初始页面
router.get('/', function (req, res) {
  res.render('douban', {results: null});
});

// 爬豆瓣
router.post('/', function (req, res) {

  // 爬取各页数据
  // console.log('req.body: ', req.body);
  // req.body { city: '深圳', excludeWords: '福田，限妹子，限女' }
  var city = req.body.city;
  var includeWords = req.body.includeWords.split(/[,，]/);
  var excludeWords = req.body.excludeWords.split(/[,，]/);
  var requestOpts = [];
  switch (city) {
    case '北京':
      requestOpts = bjRequestOpts;
      break;
    case '深圳':
      requestOpts = szRequestOpts;
      break;
    default:
      requestOpts = [];
  }

  ep.after('topic_titles', pageNum, function (topics) {
    // topics 是个数组，包含了 n次 ep.emit(event, cbData) 中的cbData所组成的数组
    // 由于在event中已经是数组，所以这里得到的是数组的数组，下面处理可以摊平它
    var results = topics.reduce(function (pre, next) {
      return pre.concat(next);
    });
    res.render('douban', {results: results});
  });

  requestOpts.forEach(function (opt) {
    request(opt, function (error, response, body) {
      if (error) {
        throw new Error(error);
      }
      var $ = cheerio.load(body, {
        normalizeWhitespace: true,
        decodeEntities: false
      });
      var items = [];
      $('.olt tr').slice(1).each(function (index, el) {
        var title = $('.title > a', el).attr('title');
        if (checkIncludeWords(title, includeWords) && checkExcludeWords(title, excludeWords)) {
          items.push({
            title: title,
            href: $('.title > a', el).attr('href'),
            lastTime: $('.time', el).text()
          });
        }
      });
      // 发布单个请求完成事件并返回结果（数组）
      ep.emit('topic_titles', items);
    });
  });

});

/**
 * 请求参数初始化
 * @param: urls:请求的url、 opts：请求header参数， num：爬取的页数
 */
function initRequestOpt(urls, opts, num) {
  urls.forEach(function (url) {
    for (var i = 0; i < num; i++) {
      opts.push({
        method: 'GET',
        url: url,
        qs: {start: (i * 25).toString()},
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'cache-control': 'no-cache',
          'http-only': true,
          //'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
          'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36'
          // 'cookie': 'll="118282"; bid=jqK8RjiBY0Q; dbcl2="146135697:9T1g8om8WS0"; ct=y; ck=ze-Q; _vwo_uuid_v2=79FA0A89061788999AD5163733A97412|d93e1ccdf54b937f63c9750d7c8e90c2; _pk_ref.100001.8cb4=%5B%22%22%2C%22%22%2C1472368010%2C%22https%3A%2F%2Fwww.baidu.com%2Flink%3Furl%3DoliRXA7g38gH6-Ut0rYcrUyDMCX0qL5O99qP9KAN4jm%26wd%3D%26eqid%3Dd48d7e270004c4d40000000657bef603%22%5D; ap=1; push_noty_num=0; push_doumail_num=0; _pk_id.100001.8cb4=0260c3428e3bf70c.1472132617.4.1472370032.1472362347.; __utma=30149280.66548113.1472132621.1472361826.1472368011.5; __utmc=30149280; __utmz=30149280.1472132621.2.2.utmcsr=baidu|utmccn=(organic)|utmcmd=organic; __utmv=30149280.14613'
        }
      });
    }
  });
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

module.exports = router;