/**
 * Created by qieguo on 2016/9/7
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require('../config');
var BaseModel = require("./base_model");

var TopicTitleSchema = new Schema({
  title: String,
  topic_id: String,
  author: {id: String, name: String},
  reply_count: {type: Number, default: 0},
  last_reply_at: Date,
  tags: [{type: String}]
});

TopicTitleSchema.plugin(BaseModel);
TopicTitleSchema.index({last_reply_at: -1});
TopicTitleSchema.index({author_name: 1});
TopicTitleSchema.index({title: 1});
TopicTitleSchema.index({tags: 1});

mongoose.model('TopicTitle', TopicTitleSchema);
