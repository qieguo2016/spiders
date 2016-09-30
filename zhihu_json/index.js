/**
 * Created by zhouyongjia on 2016/9/30.
 */
'use strict';

const spider = require('./lib/zhihu');
const logger = require('./lib/logger');

logger.debug('======  start spider  ======\r\n');

spider.startFetch(function (err) {
  if (err) {
    logger.error('fetch data fail:', err);
  } else {
    spider.startLoad(function (err) {
      if (err) {
        logger.error('load images fail:', err);
      } else {
        logger.debug('\r\n======  finish load all images  ======');
      }
    });
  }
});

//spider.startLoad(function (err) {
//  if (err) {
//    logger.error('load images fail:', err);
//  } else {
//    logger.debug('\r\n======  finish load all images  ======');
//  }
//});