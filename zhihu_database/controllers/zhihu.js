/**
 * Created by qieguo on 2016/9/28.
 */

'use strict';

const request = require('superagent');
//require('superagent-proxy')(request);   // extend with Request#proxy()
const cheerio = require('cheerio');
const cookie = require('cookie');
const async = require('async');
const util = require('util');
const fs = require('fs');
const path = require('path');

const config = require('../config');
const logger = require('../common/logger');
const User = require('../models/').User;

let baseUrl = 'https://www.zhihu.com/question/' + config.questionToken;
let pageUrl = 'https://www.zhihu.com/node/QuestionAnswerListV2';
let cookies = config.cookies[2];
let userAgent = config.userAgent[2];
//let proxy = config.proxy[0];

function toCookieObj(cookieInput) {
  let result = [];
  if (util.isArray(cookieInput)) {
    for (let el of cookieInput) {
      result.push(el.split(';')[0]);
    }
    return cookie.parse(result.join(';'));
  } else {
    return cookie.parse(cookieInput);
  }
}

function toCookieStr(cookieObj) {
  let result = '';
  for (let el in cookieObj) {
    result += el.toString() + '=' + cookieObj[el].toString() + '; ';
  }
  return result;
}

/**
 * 解析爬取到的html字符串，返回user信息
 * 第一页出错就拿不到_xsrf，没法继续往下走，所以应该终止程序并抛出异常
 * 同理，数据库操作异常也一样不能终止程序，但是既然是首页，还是抛出的好。
 * @return <object> 返回结果
 * - results: <array>，user数组
 * - _xsrf: html中埋点的xsrf码
 * - num: 答案数量
 * @param <string> html，需要解析的html字符串
 */
function parseHtml(html) {
  let results = [];
  let $ = cheerio.load(html, {
    normalizeWhitespace: true,
    decodeEntities     : false,
  });
  let _xsrf = $('[name=_xsrf]').attr('value');
  let num = $('#zh-question-answer-num').attr('data-num');
  $('.zm-item-answer').each(function () {
    let $item = $(this);
    let _link = $('.author-link', $item);
    let imgs = [];
    $('noscript img', $item).each(function () {
      imgs.push($(this).attr('data-original'));
    });
    let author = {
      name     : _link.text(),
      link     : _link.attr('href'),
      avatar   : $('.zm-list-avatar', $item).attr('src'),
      signature: $('.bio', $item).text(),
      imgs     : imgs,
    };
    results.push(author);
  });
  return {results: results, _xsrf: _xsrf, num: num};
}

/**
 * 爬取第一页数据
 * 第一页出错就拿不到_xsrf，没法继续往下走，所以应该终止程序并抛出异常
 * 同理，数据库操作异常也一样不能终止程序，但是既然是首页，还是抛出的好。
 * @param <string> url，分页请求路径
 * @param <function> cb，回调函数，
 * - err: 出错信息，终止整个程序
 */
function fetchFirstPage(url, cb) {
  request
    .get(url)
    .set('Content-Type', 'text/html; charset=UTF-8')
    .set('User-Agent', userAgent)
    .set('Cookie', cookies)
    .end(function (err, resp) {
      if (err) {
        logger.error('request error: ', err);
        return cb(err);
      }
      let data = parseHtml(resp.text);
      let cksObj = toCookieObj(resp.headers['set-cookie']);
      let oldcks = toCookieObj(cookies);
      cksObj._xsrf = cksObj._xsrf || oldcks._xsrf || data._xsrf;
      cookies = toCookieStr(Object.assign({}, oldcks, cksObj));
      // 数据库出错不应该终止程序，但是首页出现这样的问题，还是应该cb(err)
      User.create(data.results, function (err) {
        if (err) {
          logger.error('database error: ', err);
          cb(err);
        } else {
          logger.debug('save first page successfully');
          cb(null, data.num);
        }
      });
    });
}

/**
 * 爬取分页数据
 * 注意异常处理，后面分页抓取的时候遇到异常不应该终止程序，而是应该捕获异常继续往下走
 * 同理，数据库操作异常也一样不能终止程序，但是要注意将出错信息记录下来。
 * @param <object> opt，分页配置：
 * - url   : <string> 分页请求路径
 * - token : <number> 问题token
 * - size  : <number> 分页尺寸
 * - offset: <number> 分页偏移量，size*页码
 * @param <function> cb，回调函数，
 * - err: 出错信息，外围程序应该捕获这个err，不要让它终止了整个程序
 */
function fetchPage(opt, cb) {
  let xsrf = toCookieObj(cookies)._xsrf;
  let params = JSON.stringify({"url_token": opt.token, "pagesize": opt.size || 10, "offset": opt.offset});
  request
    .post(opt.url)
    .send({method: 'next', params: params})
    .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
    .set('User-Agent', userAgent)
    .set('Cookie', cookies)
    .set('X-Xsrftoken', xsrf)      //这里要拿上一个返回的cookie中的_xsrf或者是html中埋点的_xsrf
    .end(function (err, resp) {
      if (err) {
        // 出错也不应该终止程序，所以外围函数要捕获这个err保证下一次调用继续执行
        logger.error('request error: ', err);
        return cb(err);
      }
      let utfStr = new Buffer(resp.body.msg.join('')).toString('UTF8');
      let data = parseHtml(utfStr);
      let cksObj = toCookieObj(resp.headers['set-cookie']);
      let oldcks = toCookieObj(cookies);
      cksObj._xsrf = cksObj._xsrf || oldcks._xsrf || data._xsrf;
      cookies = toCookieStr(Object.assign({}, oldcks, cksObj));

      // 出错也不应该终止程序，所以外围函数要捕获这个err保证下一次调用继续执行
      User.create(data.results, function (err) {
        if (err) {
          logger.error('database error: ', err);
          cb(err);
        } else {
          logger.debug('save page successfully');
          cb();
        }
      });
    });
}

/**
 * 爬取数据入口函数
 * 分页爬取控制最大并发数为5
 * @param <function> cb，回调函数，
 * - err: 出错信息
 */
function startFetch(cb) {
  fetchFirstPage(baseUrl, function (err, num) {
    // 第一页出错应该终止程序并抛出异常
    if (err) {
      logger.error('fetch first page fail');
      return cb(err);
    }
    logger.debug('fetch first page successfully');

    let opts = [];
    num = Math.ceil(num / 10);
    for (let i = 1; i < num; i++) {
      opts.push({
        url   : pageUrl,
        token : config.questionToken,
        size  : 10,
        offset: 10 * i,
      });
    }
    logger.debug('page num: ', num);

    // 开始爬取其他页面，控制最大并发数为5，这里出错不调用cb
    async.eachLimit(opts, 5, function (opt, callback) {
      // 无论是否有err，都要保证函数执行下去！所以不能callbace(err)
      // err应该用其他方法收集起来，这里暂不做
      fetchPage(opt, (err)=> {callback()});
      // 加点随机性，模仿人类操作，>> 没必要
      //let delay = parseInt((Math.random() * 30000000) % 2000);
      //setTimeout(function () {
      //  logger.debug('------  start fetch page  ------');
      //  fetchPage(opt, function (err) {
      //    // 无论是否有err，都要保证函数执行下去！所以不能callbace(err)
      //    // err应该用其他方法收集起来，这里暂不做
      //    callback();
      //  });
      //}, delay);
    }, function (err) {
      if (err) {
        logger.error(err);
        cb(err);
      } else {
        logger.debug('======  finish fetch all  ======');
        cb();
      }
    });
  });
}

/**
 * 下载单个user的所有图片
 * 这里控制并发数量为5
 * @param <object> user,用户对象
 * @param <function> cb，回调函数，
 * - err: 出错信息
 */
function loadImgs(user, cb) {
  let pre = user.name || '匿名用户' + Date.now().toString().substr(5, 8);
  async.eachOfLimit(user.imgs, 10, function (img, index, callback) {
    if (!img) {
      callback();
    } else {
      let fileName = pre + '_' + index + path.extname(img);
      let write = fs.createWriteStream(config.imgsDir + fileName);
      let req = request.get(img);
      let stream = req.pipe(write);
      logger.debug('>>>>  start load: ' + fileName);
      stream.on('error', () => {
        logger.debug('!!!!  fail load: ' + fileName);
        callback();
      });
      stream.on('finish', () => {
        logger.debug('----  finish load: ' + fileName);
        callback();
      });
    }
  }, function (err) {
    if (err) {
      logger.error('!!!! A image failed to process');
      cb(err);
    } else {
      logger.debug('@@@@ finish load ' + user.name);
      cb();
    }
  });
}

/**
 * 下载图片入口函数
 * 这里控制按单个user串行爬取的方式
 * @param <function> cb，回调函数，
 * - err: 出错信息
 */
function startLoad(cb) {
  User.count({'imgs.0': {$exists: true}}, function (err, count) {
    if (err) {
      return cb(err);
    }
    logger.debug('users account: ', count);
    async.timesSeries(count, function (index, next) {
      logger.debug('&&&& user index: ', index);
      User.find({'imgs.0': {$exists: true}}).skip(index).limit(1).exec(function (err, user) {
        // 报错也不要终止程序执行
        if (err) {
          logger.error('err: ', err);
          next();
        } else {
          loadImgs(user[0], (err) => {next()});
        }
      });
    }, function (err, users) {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    });
  });
}

//startFetch(function (err) {
//  if (err) {
//    logger.error('fetch data fail:', err);
//  } else {
//    startLoad(function (err) {
//      if (err) {
//        logger.error('load images fail:', err);
//      } else {
//        logger.debug('======  finish load all images  ======');
//      }
//    });
//  }
//});

//startLoad(function (err) {
//  if (err) {
//    logger.error('load images fail:', err);
//  } else {
//    logger.debug('======  finish load all images  ======');
//  }
//});

exports.startFetch = startFetch;
exports.startLoad = startLoad;

