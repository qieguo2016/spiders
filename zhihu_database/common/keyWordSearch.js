/**
 * Created by zhouyongjia on 2016/8/31.
 */

'use strict';

// tree结构，也是利用哈希表快速查找
function KeywordSearch() {

  var tblRoot;

  function buildTree(keywords) {
    var tblCur = {},
      key,
      str_key,
      Length,
      j,
      i;

    tblRoot = tblCur;
    var couter = new Date();

    for (j = keywords.length - 1; j >= 0; j -= 1) {
      str_key = keywords[j];
      Length = str_key.length;
      for (i = 0; i < Length; i += 1) {
        key = str_key.charAt(i);
        if (tblCur.hasOwnProperty(key)) { //生成子节点
          tblCur = tblCur[key];
        } else {
          tblCur = tblCur[key] = {};
        }
      }
      tblCur.end = true; //最后一个关键字没有分割符
      tblCur = tblRoot;
    }
    // console.log("Time cost to build tree: " + (new Date() - couter) + "mm");
  }

  function search(content) {
    var tblCur,
      p_star = 0,
      n = content.length,
      p_end,
      match, //是否找到匹配
      match_key,
      match_str,
      arrMatch = [], //存储结果
      arrLength = 0; //arrMatch的长度索引
    var couter = new Date();

    while (p_star < n) {
      tblCur = tblRoot; //回溯至根部
      p_end = p_star;
      match_str = "";
      match = false;
      do {
        match_key = content.charAt(p_end);
        //本次匹配结束
        if (!(tblCur = tblCur[match_key])) {
          p_star += 1;
          break;
        } else {
          match_str += match_key;
        }
        p_end += 1;
        //是否匹配到尾部  //找到匹配关键字
        if (tblCur.end) {
          match = true;
        }
      } while (true);
      //最大匹配
      if (match) { //增强可读性
        //arrMatch[arrLength] = {
        //  key: match_str,
        //  begin: p_star - 1,
        //  end: p_end
        //};
        arrMatch[arrLength] = match_str;
        arrLength += 1;
        p_star = p_end;
      }
    }
    // console.log("Time cost to search keywords: " + (new Date() - couter) + "mm");
    return arrMatch;
  }

  this.init = function (keywords) {
    if (Object.prototype.toString.call(keywords) !== '[object Array]') {
      // console.log(Object.prototype.toString.call(keywords));
      throw new Error('check input!');
    }
    buildTree(keywords);
    return this;
  };

  this.search = function (content) {
    if (typeof(content) !== "string") {
      // console.log(typeof(content));
      throw new Error('check input!');
    }
    return search(content);
  };

};

module.exports = new KeywordSearch();