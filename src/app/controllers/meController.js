const Comic       = require('../models/Comic');
const Chapter     = require('../models/Chapter');
const shortid     = require('shortid');
const cloudinary  = require('../../config/middleware/ModelCloudinary')
const trimEng     = require('../../config/middleware/trimEng')
const { singleMongooseToObject, multiMongooseToObject } = require('../../util/mongoose');
const removeVietnameseTones  = require('../../config/middleware/VnameseToEng');
const TimeDifferent = require('../../config/middleware/TimeDifferent')
const dbHelper    = require('./dbHelper')
class meController {


  showChapter(req, res, next) {
    Chapter.find({ comicSlug: req.params.slug, chapter: req.params.chapter })
      .then(chapter => {
        // return res.json(chapter)
        res.render('me/showChapter.hbs',
          {
            layout: 'main',
            chapter: multiMongooseToObject(chapter),
          })
      })
      .catch(next);
  }

  /***** Comic Controller *****
  0. default page
  1. Render comic list
  2. Render Create comics Page
  3. Create comics
  4. Render Edit Page
  5. Update comic
  6. Destroy comic
  7. Handle Form Action Comic
  ***** Comic Controller *****/

  /***** Chapter Controller *****
  8.  Get ChapterList
  9.  Render create Chapter
  10. destroy Chapter
  11. Handle Form Action Chapter
  ***** Chapter Controller *****/
 
  // 0. default: [GET] / me / stored / comics
  storedComics(req, res, next) {

    Promise.all([Comic.find({ $and: [{ title: { $exists: true } }, { chaptername: { $not: { $exists: true } } }] }), Comic.countDocumentsDeleted()]
    )

      .then(([mangas, deletedCount]) =>
        res.render('me/Dashboard.Default.hbs',
          {
            layout: 'admin',
            deletedCount,
            mangas: multiMongooseToObject(mangas),
          })
      )
      .catch(next);
  }

  
  // 1. Render comic list: [GET] / me / stored / comics / comic-list

  getComicList(req, res, next) {
    var comicList = new Object()
    comicList = Comic.find({})  
    
    if(req.query.hasOwnProperty('_sort')) {
      comicList = comicList.sort({
        [req.query.column]: [req.query.type]
      })

    }

    dbHelper.GetComicList_Pagination_Helper(comicList, req, res, null)
    
  }
  
  // 2. Render Create comics Page: [GET] / me / stored / comics / create
  renderCreate(req, res, next) {
    res.status(200).render('me/Pages.Comic.Create.hbs',
      {
        layout: 'admin',
      });
  }

  // 3. Create comics: [Post] / me / stored / comics / create [create comic]
  createComic(req, res, next) {
    dbHelper.CreateComic_Helper(req, res, next, null)
  };

  // 4. Render Edit Page: [GET] / me / stored /comics /:slug / edit
  renderComicEdit(req, res, next) {
    dbHelper.RenderComicEdit_Helper(req, res, next, null)
  }
  // 5. Update comic: [GET] / me / stored / comics / :slug -> update
  update(req, res, next) {
    dbHelper.UpdateComic_Helper(req, res, next, null)
          
  }

  // 6. Destroy comic
  async destroyComic(req, res, next) {

    function getPromise1_2() {
      return new Promise((resolve, reject) => {
        // do something async
        /* -- First task -- */
        Comic.findOne({ slug: req.params.slug }, function (err, comic) {
          console.log("--1 Tiến hành Xóa comic thumbnail trên cloudinary: ")
          if (comic.thumbnail.length == 0) {
            console.log(' --K có thumbnail để xóa')
          }
          else {
            comic.thumbnail.map(thumbnail => {
              cloudinary.deleteMultiple(thumbnail.publicId)
                .then(result => {
                  console.log(result)
                })
                .catch(next)
            }); /* -- end First task -- */  
          }

          console.log("--2 Tiến hành Xóa chapter images trên cloudinary: ")
          Chapter.find({ comicSlug: req.params.slug })
            .then(chapters => {
              // console.log(chapters)
              //  console.log(chapters[0].image)
              if (chapters) {
                chapters.map(chapter => {
                  chapter.image.map(image => new Promise((resolve, reject) => {
                    // res.json(image)
                    let imagePublicId = image.publicId
                    console.log(imagePublicId)
                    cloudinary.deleteMultiple(imagePublicId)
                      .then(result => {
                        console.log(result)
                      })
                      .catch(next)
                  }))
                })
              }
              else {
                console.log(' --K có chapter images để xóa')
              }
            })

            //resolve bên dưới này nếu để bên trên là hàm chạy chưa hết
            //resolve như return
            .then(result => {
              resolve(result)
            })
        });

      });
    }

    function getPromise3() {

      return new Promise((resolve, reject) => {
        // do something async
        /* -- Third task -- */
        console.log("--3 Tiến hành Xóa chapters trên mongodb: ")
        Chapter.deleteMany({ comicSlug: req.params.slug })
          .then((result) => {
            resolve(result);
            res.status(200);
          })
          .catch(next) /* -- end Third task -- */
      })
    } // end promise 3

    function getPromise4() {
      return new Promise((resolve, reject) => {
        // do something async
        /* -- Fourth task -- */
        console.log("--4 Tiến hành Xóa comic trên mongodb: ")
        Comic.deleteOne({ slug: req.params.slug })
          .then((result) => {
            resolve(result);
            res.status(200).redirect('back');
          })
          .catch(next) /* -- end Fourth task -- */
      });
    }

    getPromise1_2().then(() => {
      return Promise.all([getPromise3(), getPromise4()]);
    }).then((args) => console.log(args)); // result from 2 and 3
  } 
  
  // 7. Handle Form Action Comic: [POST] / me / stored / handle-form-action-for-comic
  async handleFormActionForComics(req, res, next) {
    //res.json(req.body)
    // var comicSlugs = req.body.comicSlug;
    // console.log(comicSlugs)
    var chapterExisted = true;
    switch (req.body.action) {
      case 'delete':
        //comicSlugs là biến đã đặt trong html
        var comicSlugs = req.body.comicSlug;
        if(!comicSlugs) {
          req.flash('error-message', 'Bạn chưa chọn truyện')
          res.status(404).redirect('back');
        } else {
          comicSlugs.map(comicSlug => {
            //console.log(comicSlug) //test-qP64bRH31 //test-d00cQa9fo
            Comic.findOne({ slug: comicSlug }, function (err, currentComic) {
              console.log("-- 1.Tiến hành Xóa comic thumbnail trên cloudinary" + " [" + comicSlug + "]:")
              if (currentComic.thumbnail.length == 0) {
                console.log(' --K có thumbnail để xóa')
              } else {
                currentComic.thumbnail.map(thumbnail => {
                  cloudinary.deleteMultiple(thumbnail.publicId)
                    .then(result => {
                      console.log(result)
                    })
                    .catch(next)
                }); /* -- end First task -- */
              }
            });
            Chapter.findOne({ comicSlug: comicSlug }, function (err, currentChapter) {
              // Nếu image length > 0 thì tức là có chapter image
              
              if (!currentChapter) {
                chapterExisted = false;
                console.log(' --K có chapter để xóa')
              }
              else {
                console.log("-- 2.Tiến hành Xóa chapter images trên cloudinary" + " [" + currentChapter.chapter + "]:")
                currentChapter.image.map(chapterImage => {
                  cloudinary.deleteMultiple(chapterImage.publicId)
                    .then(result => {
                      console.log(result)
                    })
                    .catch(next)
                })
              }
            })
  
          })
  
          
          //reg.body.comicSlug là mảng[ ]
          Comic.deleteMany({ slug: { $in: req.body.comicSlug } })
            .then(() => {
              res.status(200);
            })
            .catch(next)
            console.log(chapterExisted)
          if (chapterExisted == true) {
            Chapter.deleteMany({ comicSlug: { $in: req.body.comicSlug } })
            .then(() => {
              res.status(200).redirect('back');
            })
            .catch(next)
          }

        }
         
        
        break;
      default:
        req.flash('error-message', 'Action không hợp lệ')
        res.status(404).redirect('back')
    }
  }


  // 8. Get ChapterList: [GET] / me / stored / comics / :slug / chapter-list
  getChapterList(req, res, next) {
    Chapter.find({ comicSlug: req.params.slug })
      .select('title chapterSlug createdAt updatedAt description thumbnail comicSlug chapter')
      .then((chapters) => {
        if (chapters) {
            //console.log(Object.keys(chapters).length === 0);// true
            var linkComics = req.params.slug;  
            chapters.map(chapter => {
            var time = TimeDifferent(chapter.updatedAt)
            chapter["chapterUpdateTime"] = time;
          })
          res.status(200).render('me/Pages.Comics.ChapterList.hbs', {
            layout: 'admin',
            linkComics,
            chapters: multiMongooseToObject(chapters)
          })
        }
      })
      .catch(next);
  }

  // 9. Render create Chapter: [GET] / me / stored / comics / :slug / create-chapter
  renderCreateChapter(req, res, next) {
    var linkComics = req.params.slug;
    res.status(200).render('me/Pages.Chapter.Create.hbs', {
      layout: 'admin',
      linkComics,
    })
  }

  // 10. destroy Chapter
  async destroyChapter(req, res, next) {
    await Chapter.findOne({ chapterSlug: req.params.slug }, function (err, chapter) {
      // return res.json(chapter)
      console.log("vào if 1")
      chapter.image.map(image => {
        let imagePublicId = image.publicId
        console.log("-- Xóa images trên cloudinary: ")
        cloudinary.deleteMultiple(imagePublicId)
          .then(result => {
            console.log(result)
          })
          .catch(next)
        });
        Chapter.deleteOne({ chapterSlug: req.params.slug }) //slug của chapters
          .then(() => {
            console.log("-- Xóa images trên mongodb: ")
            res.status(200).redirect('back');
          })
          .catch(next)
      }) // end map image
   
  }

  // 11. Handle Form Action Chapter: [POST] / me / stored / handle-form-action-for-comic
  async handleFormActionForChapters(req, res, next) {
    //res.json(req.body)
    // var chapterSlugs = req.body.chapterSlug;
    // console.log(chapterSlugs)
    switch (req.body.action) {
      case 'delete':
        //chapterSlugs là biến đã đặt trong html
        var chapterSlugs = req.body.chapterSlug;
        if(!chapterSlugs) {
          req.flash('error-message', 'Bạn chưa chọn chapter')
          res.status(404).redirect('back');
        } else {
          chapterSlugs.map(chapterSlug => {
            Chapter.findOne({ chapterSlug: chapterSlug }, function (err, currentChapter) {
              // Nếu image length > 0 thì tức là có chapter image
              console.log("-- 2.Tiến hành Xóa chapter images trên cloudinary" + " [" + currentChapter.chapter + "]:")
              if (!currentChapter) {
                console.log(' --K có chapter để xóa')
              }
              else {
                currentChapter.image.map(chapterImage => {
                  cloudinary.deleteMultiple(chapterImage.publicId)
                    .then(result => {
                      console.log(result)
                    })
                    .catch(next)
                })
              }
            })
  
          })
  
            Chapter.deleteMany({ chapterSlug: { $in: req.body.chapterSlug } })
            .then(() => {
              res.status(200).redirect('back');
            })
            .catch(next)

        }
         
        
        break;
      default:
        req.flash('error-message', 'Action không hợp lệ')
        res.status(404).redirect('back')
    }
  }

}

//export (SiteController) thì lát require nhận được nó
module.exports = new meController();
