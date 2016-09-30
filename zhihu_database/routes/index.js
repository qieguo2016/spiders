/**
 * Created by qieguo on 2016/9/28.
 * router entry of this project.
 */

'use strict';

var express = require('express');
var router = express.Router();
var zhihu = require('./zhihu');

// 展示知乎爬虫页面
router.get('/', zhihu.showZhihu);

// 启动知乎爬虫
router.post('/fetch', zhihu.startFetch);

module.exports = router;