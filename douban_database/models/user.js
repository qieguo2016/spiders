/**
 * Created by zhouyongjia on 2016/9/26.
 */

var mongoose = require('mongoose');
// var BaseModel = require("./base_model");
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    name: String,
    link: String,
    avatar: String,
    signature: String,
    imgs: [{type: String}],
    sex: String,
    age: Number,
    city: String,
    trade: String,
    company: String,
    job: String,
    university: String,
    major: String,
    profile: String,
    //weibo    : String,
    //wechat   : String,
    //qq       : String,
    //email    : String,
    contact: [{key: String, value: String}],    //所有联系方式均放入这里，email、qq、wechat、weibo
    tags: [{type: String}],
    register_at: Date,
    record_at: {type: Date, default: Date.now},
});

// UserSchema.plugin(BaseModel);
UserSchema.index({name: 1});
// UserSchema.index({age: 1});

mongoose.model('User', UserSchema);
