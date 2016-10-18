/**
 * Created by qieguo on 2016/8/25 0025.
 */

'use strict';

var express = require('express');
var router = express.Router();
var lagou = require('./spiderLagou');

// 爬虫页面渲染
router.get('/', lagou.renderPage);

// 返回爬取结果
router.post('/lagou', lagou.fetchData);

module.exports = router;
