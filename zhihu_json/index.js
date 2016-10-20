/**
 * Created by zhouyongjia on 2016/9/30.
 */
'use strict';

const spider = require('./lib/zhihu');
const logger = require('./lib/logger');

logger.debug('======  start spider  ======\r\n');

// startFetch是爬取图片链接的函数，正常流程是先爬链接后下载图片。

spider.startFetch(function (err) {
  if (err) {
    logger.error('fetch data fail:', err);
  } else {
    spider.startLoad(function (err) {
      if (err) {
        logger.error('load images fail:', err);
      } else {
        logger.debug('\r\n======  end spider  ======');
      }
    });
  }
});

// startLoad是下载图片的函数。
// 若爬到json文件但没下载到图片的话，可以直接使用下面的函数下载图片。
/*
spider.startLoad(function (err) {
  if (err) {
    logger.error('load images fail:', err);
  } else {
    logger.debug('\r\n======  finish load all images  ======');
  }
});*/
