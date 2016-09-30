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
const logger = require('../common/logger');

const config = require('../config');
//var zhihu = require('../controllers/zhihu');

var baseUrl = 'https://www.zhihu.com/question/37709992';
var pageUrl = 'https://www.zhihu.com/node/QuestionAnswerListV2';
var cookies = config.cookies[2];
var userAgent = config.userAgent[2];
var proxy = config.proxy[0];
var answerNum = 0;

function showZhihu(req, res) {
  res.render('index', {
    title: '知乎爬虫'
  });
}

//function startFetch(req, res, next) {
function startFetch() {

  let results = [];
  fetchFirstPage(baseUrl, function (err, data, num) {
    if (err) { return logger.error(err);}

    logger.debug('------  fetch first page success  ------');

    let opts = [];
    num = Math.ceil(num / 10);
    for (let i = 1; i < num; i++) {
      opts.push({
        url   : pageUrl,
        token : 37709992,
        size  : 10,
        offset: 10 * i,
      });
    }

    logger.debug('num: ', num);

    // 开始爬取其他页面，控制最大并发数为5。
    async.mapLimit(opts, 5, function (opt, callback) {
      //fetchUrl(page, callback);
      // 加点随机性，欺骗服务器
      var delay = parseInt((Math.random() * 30000000) % 2000, 10);
      setTimeout(function () {
        fetchPage(opt, callback);
        logger.debug('------  start fetch page  ------');
      }, delay);
    }, function (err, users) {
      if (err) { return logger.error(err);}
      var r = users.reduce(function (pre, next) {
        return pre.concat(next);
      });
      results = data.concat(r);

      logger.debug('------  finish fetch all  ------');
      startLoad(results, function (err) {
        if (err) {
          logger.error(err);
        } else {
          logger.debug('------  all finish!  ------');
        }
      });
      //fs.writeFile('../output.json', JSON.stringify(results), 'utf-8', function () {
      //  console.log('--------------- send data ---------------');
      //  //res.send(results);
      //})
    });
  });
}

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
 * opt
 *    url   : 'url',
 *    token : 'number',
 *    size  : 'number',
 *    offset: 'number',
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
      if (err) { return cb(err);}
      let utfStr = new Buffer(resp.body.msg.join('')).toString('UTF8');
      let data = parseHtml(utfStr);
      let cksObj = toCookieObj(resp.headers['set-cookie']);
      let oldcks = toCookieObj(cookies);
      cksObj._xsrf = cksObj._xsrf || oldcks._xsrf || data._xsrf;
      cookies = toCookieStr(Object.assign({}, oldcks, cksObj));
      cb(null, data.results);
    });
}

function fetchFirstPage(url, cb) {
  request
    .get(url)
    .set('Content-Type', 'text/html; charset=UTF-8')
    .set('User-Agent', userAgent)
    .set('Cookie', cookies)
    .end(function (err, resp) {
      if (err) { return cb(err);}
      let data = parseHtml(resp.text);
      let cksObj = toCookieObj(resp.headers['set-cookie']);
      let oldcks = toCookieObj(cookies);
      cksObj._xsrf = cksObj._xsrf || oldcks._xsrf || data._xsrf;
      cookies = toCookieStr(Object.assign({}, oldcks, cksObj));
      cb(null, data.results, data.num);
    });
}

//name       : _link.text(),
//link       : _link.attr('href'),
//avatar     : $('.zm-list-avatar', $item).attr('src'),
//imgs       : '',
//signature  : $('.bio', $item).text(),
//sex        : '',
//age        : '',
//city       : '',
//company    : '公司',
//trade      : '行业',
//job        : '职位',
//university : '学校',
//major      : '专业',
//profile    : '简介',
//contact    : [{key: String, value: String}],    //所有联系方式均放入这里，email、qq、wechat、weibo
//tags       : [{type: String}],
//register_at: Date,
//record_at  : {type: Date, default: Date.now},


/**
 * proxy setting
 */

  // HTTP, HTTPS, or SOCKS proxy to use

  //console.log('------  start  ------');
  //
  //request
  //  .get('https://www.baidu.com/')
  //  .proxy('http://194.75.54.117:8080')
  //  .set('Content-Type', 'text/html; charset=UTF-8')
  //  .set('User-Agent', userAgent)
  //  .end(onresponse);
  //
  //function onresponse(err, res) {
  //  if (err) {
  //    return console.log(err);
  //  } else {
  //    console.log(res.body);
  //  }
  //}


  //const request = require("request");
  //
  //// 要访问的目标页面
  //const targetUrl = "http://www.baidu.com";
  ////const targetUrl = "http://proxy.abuyun.com/switch-ip";
  ////const targetUrl = "http://proxy.abuyun.com/current-ip";
  //
  //// 代理服务器
  //const proxyHost = "proxy.abuyun.com";
  //const proxyPort = 9010;
  //
  //// 代理隧道验证信息
  //const proxyUser = "H01234567890123P";
  //const proxyPass = "0123456789012345";
  //
  ////const proxyUrl = "http://" + proxyUser + ":" + proxyPass + "@" + proxyHost + ":" + proxyPort;
  //const proxyUrl = "http://194.75.54.117:8080";
  //
  //const proxiedRequest = request.defaults({'proxy': proxyUrl});
  //
  //proxiedRequest
  //  .get(targetUrl, function (err, res, body) {
  //    console.log("got response: " + body);
  //  })
  //  .on("error", function (err) {
  //    console.log(err);
  //  })
  //;

startFetch();


function loadImgs(user, cb) {
  async.eachOfLimit(user.imgs, 10, function (img, index, callback) {
    if (!img) {return false;}
    let fileName = user.name + '_' + index + path.extname(img);
    let write = fs.createWriteStream('../imgs/' + fileName);
    let req = request.get(img);
    let stream = req.pipe(write);
    logger.debug('start load: ' + fileName);
    stream.on('finish', () => {
      logger.debug('finish load: ' + fileName);
      callback();
    });
  }, function (err) {
    if (err) {
      logger.error('A image failed to process');
      cb(err);
    } else {
      logger.debug('All images have been processed successfully');
      cb();
    }
  });
}

//var testUsr = {
//  "name"     : "小碘",
//  "link"     : "/people/xiao-dian-65",
//  "avatar"   : "https://pic2.zhimg.com/9484168e7ed23197de39341dbe3034e5_s.jpg",
//  "signature": " 少女没有心。 ",
//  "imgs"     : [
//    "https://pic2.zhimg.com/c023208ccdb4194cefde6aa7fce1ef4d_r.jpg",
//    "https://pic2.zhimg.com/be7600989233bdf438e5ba23f2cdb685_r.jpg",
//    "https://pic2.zhimg.com/b6274542f3785c27ab4a38d4db906efd_r.jpg",
//    "https://pic2.zhimg.com/0930549116d22ffce22e98c32683d621_r.jpg",
//    "https://pic2.zhimg.com/2f5ba5f7e45002945a77277c87f3f4a5_r.jpg",
//    "https://pic3.zhimg.com/f0029825f3a16a38ab6677dece0126ea_r.jpg",
//    "https://pic4.zhimg.com/6b01fc7ab3ce3707cc8fb0bbb1e5f797_r.jpg",
//    "https://pic3.zhimg.com/4c8b35a98670c85d2e4ac238329ee47a_r.jpg",
//    "https://pic2.zhimg.com/8d985a7cb32c0a026be3affa504f92e1_r.jpg",
//    "https://pic4.zhimg.com/da2d3b684ca2102ce8f3bbb8fd5b1cc7_r.jpg",
//    "https://pic3.zhimg.com/82207ceac95140a3f177649f24945626_r.jpg",
//    "https://pic3.zhimg.com/6c2b2ed9090ac86fcce9e53c4b1010da_r.jpg"
//  ]
//};

//loadImgs(testUsr);

function startLoad(users, cb) {
  //fs.readFile(file, function (err, users) {
  //  if (err) {
  //    return logger.error(err);
  //  }
  //  users = JSON.parse(users);

  async.eachSeries(users, function (user, callback) {
    logger.debug('start load user: ' + user.name);
    loadImgs(user, callback);
  }, function (err) {
    if (err) {
      logger.error('A user failed to process');
      cb(err);
    } else {
      logger.debug('All users have been processed successfully');
      cb();
    }
  });
  //});
}

//startLoad('output.json', function (err) {
//  if (err) {
//    logger.error(err);
//  } else {
//    logger.debug('------  all finish!  ------');
//  }
//});

exports.showZhihu = showZhihu;
exports.startFetch = startFetch;

