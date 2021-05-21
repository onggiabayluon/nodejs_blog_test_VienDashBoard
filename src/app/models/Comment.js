const mongoose        = require('mongoose');
const Schema          = mongoose.Schema;
//import plugin slug mongoose
const moment          = require('moment-timezone');
const trimEng         = require('../../config/middleware/trimEng')

const opts = { timestamps: { currentTime: () => moment.tz(Date.now(), "Asia/Bangkok") }};

const Comment = new Schema({
  comicSlug: { type: String },
  chapterArr: [
    {
      chapter: { type: String }, // chapter-1
      createdAt: { type: Date, default: new Date().toISOString()},
      comment: [{
        //1. user
        userId: { 
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }, 
        //2. text
        text: { type: String },
        //3. reply
        reply: [{
          //3.1 user 
          userId: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
          },
          //3.2 text
          text: { type: String },
        }] 
      }],
    }
  ]
}, opts);

module.exports = mongoose.model('Comment', Comment);

