var mongoose = require('mongoose');
var config = require('../config');
var logger = require('../common/logger');

// 使用Node的promise代替mongoose的内置promise
mongoose.Promise = global.Promise;
mongoose.connect(config.db, {
  server: {poolSize: 20}
}, function (err) {
  if (err) {
    logger.error('connect to %s error: ', config.db, err.message);
    process.exit(1);
  }
});

// models
// require('./topic');
// require('./topicTitle');
//require('./user');
//require('./reply');
//require('./topic_collect');
require('./user');

// exports.Topic = mongoose.model('Topic');
// exports.TopicTitle = mongoose.model('TopicTitle');
//exports.User = mongoose.model('User');
//exports.Reply = mongoose.model('Reply');
//exports.TopicCollect = mongoose.model('TopicCollect');
exports.User = mongoose.model('User');
