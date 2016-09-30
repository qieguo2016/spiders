/**
 * Created by qieguo on 2016/9/3 0003.
 */

'use strict';

var async = require('async');
var fetchUrls = require('./common/fetchUrls');
var fetchDetail = require('./common/fetchDetail');
var logger = require('./common/logger');

var urls = [
  'https://www.douban.com/group/106955/discussion',
  'https://www.douban.com/group/nanshanzufang/discussion',
  'https://www.douban.com/group/fangzi/discussion',
  'https://www.douban.com/group/26926/discussion',
  'https://www.douban.com/group/beijingzufang/discussion',
  'https://www.douban.com/group/279962/discussion'
];


function fetchData() {
  fetchUrls(urls, 5, function (err) {
    if (err) {
      return console.log('------ end ------', err);
    }
    console.log('------ end ------');
    // async.eachLimit(UrlOpts, 5, function (opt, callback) {
    //   console.log('fetchDetail of ' + opt.href);
    //   fetchDetail({url: opt.href}, callback);
    // }, function (err) {
    //   console.error('error: ', err);
    // });
  });
}

fetchData();

// module.exports = fetchData;

