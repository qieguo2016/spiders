/**
 * Created by zhouyongjia on 2016/10/3.
 */
'use strict';

const spider = require('../controllers/zhihu');
const logger = require('../common/logger');

spider.startFetch(function (err) {
  if (err) {
    logger.error('fetch data fail:', err);
  } else {
    spider.startLoad(function (err) {
      if (err) {
        logger.error('load images fail:', err);
      } else {
        logger.debug('======  finish load all images  ======');
      }
    });
  }
});
