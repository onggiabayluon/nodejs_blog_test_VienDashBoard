const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//import plugin slug mongoose
const moment = require('moment-timezone');


const opts = {
  // set lại time zone sang asia
  timestamps: { currentTime: () => moment.tz(Date.now(), "Asia/Bangkok") },
};
const Chapter = new Schema({
    title: { type: String },
    comicSlug: { type: String },
    chapter: { type: String, unique: true },
    description: { type: String },
    chapterSlug: { type: String },
    chapterUpdateTime: { type: String },
    image: [
      {
        name: String,
        url: String,
        publicId: { type: String },
      }
    ],
  }, opts);

  module.exports = mongoose.model('Chapter', Chapter);