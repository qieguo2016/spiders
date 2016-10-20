/**
 * Created by qieguo on 2016/9/30.
 */
'use strict';

const spider = require('./lib/zhihu');
const logger = require('./lib/logger');

logger.debug('======  start spider  ======\r\n');


// startLoad是下载图片的函数。
// 若爬到json文件但没下载到图片的话，可以直接使用下面的函数下载图片。
spider.startLoad(function (err) {
  if (err) {
    logger.error('load images fail:', err);
  } else {
    logger.debug('\r\n======  finish load all images  ======');
  }
});
