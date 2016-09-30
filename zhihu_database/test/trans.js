/**
 * Created by zhouyongjia on 2016/9/28.
 */
'use strict';

let b = '\u7684\u8003\u8651\u4e86\u7968\u672c\u4eba\u4f1a\u4e0d\u4f1a\u559c'
let a = new Buffer(b).toString('UTF8');
console.log('a', a);