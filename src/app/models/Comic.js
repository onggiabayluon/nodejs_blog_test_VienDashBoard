const mongoose        = require('mongoose');
const Schema          = mongoose.Schema;
//import plugin slug mongoose
const slug            = require('mongoose-slug-generator');
const mongooseDelete  = require('mongoose-delete');
const moment          = require('moment-timezone');
const trimEng         = require('../../config/middleware/trimEng')

const opts = {
  // set lại time zone sang asia
  timestamps: { currentTime: () => moment.tz(Date.now(), "Asia/Bangkok") },
};
const Comic = new Schema({
  title: { type: String },
  titleForSearch: { type: String },
  // chaptername: { type: String },
  // chapter: { type: String, unique: true },
  description: { type: String },
  videoId: { type: String },
  userId: { type: String },
  userName: { type: String },
  slug: { type: String },
  comicUpdateTime: { type: String },
  thumbnail: [
    {
      name: String,
      url: String,
      publicId: { type: String },
    }
  ],
}, opts);



  // Add plugin
  mongoose.plugin(slug);
  Comic.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true  
  });


  //               mongoose.model('ModelName', mySchema);
  module.exports = mongoose.model('Comic', Comic);

