var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require('../config');
var _ = require('lodash');
var BaseModel = require("./base_model");

var TopicSchema = new Schema({
  topic_id: String,
  title: String,
  content: String,
  author: {id: String, name: String},
  create_at: Date,
  reply_count: {type: Number, default: 0},
  reply: [{name: String, content: String, reply_at: Date}],
  last_reply_at: Date,
  imgs: [{type: String}],
  tags: [{type: String}]
});

TopicSchema.plugin(BaseModel);
TopicSchema.index({create_at: -1});
TopicSchema.index({last_reply_at: -1});
TopicSchema.index({author_name: 1});
TopicSchema.index({title: 1});
TopicSchema.index({tags: 1});

mongoose.model('Topic', TopicSchema);
