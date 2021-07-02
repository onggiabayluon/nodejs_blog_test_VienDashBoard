//Mô hình mvc: từ clients --> 1. request lên controller --> 2. chọc vào model
// --> 3. lấy được dữ liệu mang về controller --> 4. chọc sang views, lấy data
// từ model truyền sang views --> 5. views render trả về client



const Comic     = require('../models/Comic');
const Chapter   = require('../models/Chapter');
const Comment   = require('../models/Comment');
const Category  = require('../models/Category')
const ObjectId    = require('mongoose').Types.ObjectId;
const TimeDifferent = require('../../config/middleware/CalcTimeVnmese')

const { singleMongooseToObject, multiMongooseToObject } =  require('../../util/mongoose');
const User = require('../models/User');

class SiteController {

    
    // [GET] / Site
    index(req, res, next) {
       
        Promise.all([
            Comic.find({ chaptername: { $not: { $exists: true } } }).lean()
            .populate({
                path: 'chapters',
                select: 'chapter',
                options: {
                    limit: 2,
                    sort: { createdAt: -1},
                }
            }),
            // Chapter.findOne({ comicSlug: req.params.slug, chapter: req.params.chapter }),
            // Comment.find({}).sort('-chapterArr.createdAt').lean()
            Comment.aggregate([
                {
                    $match:  { }
                },
                {
                    $sort: {'updatedAt': -1}
                },
                {
                    //limit n document = n comments needed
                    $limit: 5
                },
                {
                    $unwind: "$commentArr"
                },
                {
                    $sort: {'commentArr.updatedAt': -1}
                },
                {
                    // comments needed
                    $limit: 5
                },
                {
                    $group: {
                    _id: '$_id', 
                    chapter:    { $first: '$chapter'    }, 
                    comicSlug:  { $first: '$comicSlug'  }, 
                    title:      { $first: '$title'      }, 
                    commentArr: { $push: '$commentArr'  }}
            
                },
                {
                    $project: { commentArr: 1, chapter: 1, title: 1, comicSlug: 1,  _id: 0 }
            
                }
            ])
          ])
          .then(([comics, commentDoc]) => {
            // console.table(commentDoc)
            // console.log(commentDoc)
            //   console.log(commentDoc[0])
            //   console.log(commentDoc[1])
            res.render('home', { 
                layout: 'home_layout',
                comics: comics,
                user: singleMongooseToObject(req.user),
                commentDoc: commentDoc
             });
          })
          .catch(err => next(err))
    }
    
    // [GET] / search
    search(req, res, next) {
        let hint = "";
        let response = "";
        let searchQ = req.body.data.toLowerCase()
        
        if (searchQ.length > 0) {
            // titleForSearch là cho search không dấu
            Comic.find({ $or: [{ titleForSearch: { $regex: searchQ, $options: "i" } }, { title: { $regex: searchQ, $options: "i" }}] })
            .then(results => {
                results.map(comic => {
                    var time = TimeDifferent(comic.updatedAt)
                    comic["comicUpdateTime"] = time;
                  })
                res.render('me/page.hbs', { 
                    layout: 'page',
                    comics: multiMongooseToObject(results)
                 });
            });
        } else {
            Comic.find({ title: { $regex: searchQ, $options: "i" } })
            .then(results => {
                results.map(comic => {
                    var time = TimeDifferent(comic.updatedAt)
                    comic["comicUpdateTime"] = time;
                  })
                res.render('me/page.hbs', { 
                    layout: 'page',
                    comics: multiMongooseToObject(results)
                 });
            })
        }
        console.log("data from server: " + searchQ);
    }
}

//export (SiteController) thì lát require nhận được nó
module.exports = new SiteController();
