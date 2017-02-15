/**
 * Created by qieguo on 2016/8/25.
 */

'use strict';

var request = require("request");
var cheerio = require("cheerio");
var eventproxy = require('eventproxy');
var ep = new eventproxy();
var fs = require('fs');

var pageNum = 10, requestOpts = [];
var topicUrls = [
  'https://www.douban.com/group/106955/discussion',
  'https://www.douban.com/group/nanshanzufang/discussion'
];

initRequestOpt(topicUrls, requestOpts, pageNum);


console.log('=======  start fetch  =======');
fetchData(
  ['南山'],
  ['3[1-9]\d{2}', '限女', '限妹子'],
  function (err, results) {
    if (err) {
      console.log('err', err);
    } else {
      fs.writeFile('output.json', JSON.stringify(results, null, 2));
    }
  }
);

/**
 * 爬取数据主程序
 * @param:
 *    includeWords: <array>标题中需要包含的关键词数组
 *    excludeWords：<array>标题中需要排除的关键词数组
 */
function fetchData(includeWords, excludeWords, cb) {
  // 爬取各页数据
  ep.after('topic_titles', pageNum, function (topics) {
    // topics 是个数组，包含了 n次 ep.emit(event, cbData) 中的cbData所组成的数组
    // 由于在event中已经是数组，所以这里得到的是数组的数组，下面处理可以摊平它
    var results = topics.reduce(function (pre, next) {
      return pre.concat(next);
    });
    cb(null, results);
  });

  requestOpts.forEach(function (opt) {
    request(opt, function (error, response, body) {
      if (error) {
        return cb(error);
      }
      var $ = cheerio.load(body, {
        normalizeWhitespace: true,
        decodeEntities     : false
      });
      var items = [];
      $('.olt tr').slice(1).each(function (index, el) {
        var title = $('.title > a', el).attr('title');
        if (checkIncludeWords(title, includeWords) && checkExcludeWords(title, excludeWords)) {
          var item = {
            title   : title,
            href    : $('.title > a', el).attr('href'),
            lastTime: $('.time', el).text()
          };
          console.log('fetch item', item);
          items.push(item);
        }
      });
      // 发布单个请求完成事件并返回结果（数组）
      ep.emit('topic_titles', items);
    });
  });

}

/**
 * 请求参数初始化
 * @param: urls:请求的url、 opts：请求header参数， num：爬取的页数
 */
function initRequestOpt(urls, opts, num) {
  urls.forEach(function (url) {
    for (var i = 0; i < num; i++) {
      opts.push({
        method : 'GET',
        url    : url,
        qs     : {start: (i * 25).toString()},
        headers: {
          'Accept'       : '*/*',
          'Accept-Language': 'zh-CN,zh;q=0.8',
          'Cookie': 'bid=vkXjYPjxO6E; ll="108258";',
          'User-Agent'   : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
        }
        // 伪造报文头部，模仿浏览器行为，否则403错误
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