const Comic       = require('../models/Comic');
const Chapter     = require('../models/Chapter')
const shortid     = require('shortid');
const cloudinary  = require('../../config/middleware/ModelCloudinary')
const trimEng     = require('../../config/middleware/trimEng')
const { singleMongooseToObject, multiMongooseToObject } = require('../../util/mongoose');
const removeVietnameseTones  = require('../../config/middleware/VnameseToEng');
const TimeDifferent = require('../../config/middleware/TimeDifferent')
class meController {


  showChapter(req, res, next) {
    Chapter.find({ chapter: req.params.chapter })
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
  /*
  1. Render Admin Home
  */
  // [GET] / me / stored / comics
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

  /*
  2. Render All comic list
  */
  // [GET] / me / stored / comics / comic-list
  getComicList(req, res, next) {

    Promise.all([Comic.find( { title: { $exists: true } } ), Comic.countDocumentsDeleted()]
    )

      .then(([comics, deletedCount]) => 
      {
        comics.map(comic => {
          var time = TimeDifferent(comic.updatedAt)
          // console.log(time)
          comic["comicUpdateTime"] = time;
        })
        // console.log(comics)
        res.render('me/Pages.Comics.List.hbs',
        {
          layout: 'admin',
          deletedCount,
          comics: multiMongooseToObject(comics),
        })
      })
      .catch(next);
  }

  /*
  2.2 Render ChapterList
  */
  // [GET] / me / stored / comics / :slug / chapter-list
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

   /*
  2.3 Render create Chapter
  */
  // [GET] / me / stored / comics / :slug / create-chapter
  renderCreateChapter(req, res, next) {
    var linkComics = req.params.slug;
    res.status(200).render('me/Pages.Chapter.Create.hbs', {
      layout: 'admin',
      linkComics,
    })
  }

  /*
  3. Render Create comics
  */
  // [GET] / me / stored / comics / create
  renderCreate(req, res, next) {
    res.status(200).render('me/Pages.Comic.Create.hbs',
      {
        layout: 'admin',
      });
  }
  // [Post] / me / stored / comics / create [create comic]
  createComic(req, res, next) {
    //Chuyển title[tiếng việt] sang slug 
    if (req.body.title == '') {
      res.status(404).redirect('back')
      return req.flash('error-message', 'Bạn chưa nhập đủ thông tin truyện');
    }
    var title = req.body.title;
    var slug = removeVietnameseTones(title)
  
    Comic.findOne({ slug: slug })
    .then(comicExisted => {
      if (comicExisted) {
        // TH nếu slug ĐÃ có
        console.log('slug existed, add shortId to create new slug');
        const comic = new Comic(req.body);
        comic.slug = slug + '-' + shortid.generate();
        comic.titleForSearch = trimEng(comic.title)
        comic.save()
          .then(() => {
            req.flash('success-message', 'Tạo truyện thành công')
            res.status(404).redirect('back')
            //res.status(201).redirect('/me/stored/comics/comic-list');
          })
          .catch(err => {
            req.flash('error-message', err)
            res.status(500).redirect('back')
          });
      }
      else {
        // TH nếu slug CHƯA có
        const comic = new Comic(req.body);
        comic.slug = slug;
        comic.titleForSearch = trimEng(comic.title)
        comic.save()
          .then(() => {
            res
            .status(201)
            .redirect('/me/stored/comics/comic-list');
          })
          .catch(next);
      }
    })
    .catch(next)
      
      
  };

  /*
  4. Render Edit Page
  */

  // [GET] / me / stored /comics /:slug / edit
  renderComicEdit(req, res, next) {
    Comic.find({ slug: req.params.slug })
      .select('title slug createdAt updatedAt description thumbnail')
      .then(comicExisted => {
        if (comicExisted) {
          Chapter.find({ comicSlug: req.params.slug })
            .select('title slug createdAt updatedAt description comicSlug chapter')
            .then(chapters => {
              if (chapters) {
                res.status(200).render('me/Pages.Comic.edit.hbs', {
                  layout: 'admin',
                  chapters: multiMongooseToObject(chapters),
                  comic: multiMongooseToObject(comicExisted)
                })
              } else {
                res
                  .status(404)
                  .json({ message: "No valid entry found for provided ID" });
              }
            })
            .catch(err => {
              console.log(err);
              res.status(500).json({
                error: err
              });
            });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  }
  // [GET] / me / stored / comics / :slug -> update
  update(req, res, next) {
    
    // //update thumbnail
    // req.body.thumbnail = `https://img.youtube.com/vi/${req.body.videoId}/sddefault.jpg`;
    //update lấy Comic id, chỉnh sửa reg.body
    // tìm tất cả chapter truyện lưu vào biến để lát thay đổi hêt các chaptername
    var newtitle = req.body.title;
    var oldSlug = req.params.slug;
    var newSlug = removeVietnameseTones(newtitle)

    var titleforsearch = {titleForSearch: trimEng(newtitle)}
    var jsonFile = req.body
    var finalReqBody = Object.assign({}, jsonFile, titleforsearch);

        Comic.findOne({ slug: req.params.slug })
        .then(page => {
          if (newtitle !== page.title) {
            Comic.findOne({ slug: newSlug })
            .then(slugExisted => {
              // tra cái slug mới xem có slugcheck nào có chưa 
              // nếu slug mới mà có sử dụng r` thì slug cũ = slug mới + shortId
              if (slugExisted) {

                // đổi slug cũ sang slug mới 
                req.body.slug = newSlug + '-' + shortid.generate();

                Chapter.updateMany({ comicSlug: oldSlug }, { comicSlug: req.body.slug })
                  .select("comicSlug")
                  .then(result => { console.log(result) })
                  .catch(next)
                
                  
                Comic.updateOne({ slug: req.params.slug }, finalReqBody)
                  .then(() => {
                    res
                    .status(200)
                    .redirect('/me/stored/comics/comic-list');
                  })
                  .catch(next)

              } else {
                // nếu slug mới chưa có sử dụng thì slug cũ = slug mới
                req.body.slug = newSlug;
                Chapter.updateMany({ comicSlug: oldSlug }, { comicSlug: newSlug })
                  .select("comicSlug")
                  .then(result => { console.log(result) })
                Comic.updateOne({ slug: req.params.slug }, finalReqBody)
                  .then(() => {
                    res
                    .status(200)
                    .redirect('/me/stored/comics/comic-list');
                  })
                  .catch(next)
              }
            })
          } else {
            // Nếu title mới giống title cũ thì update bình thường, không update slug
            Comic.updateOne({ slug: req.params.slug }, finalReqBody)
              .then(() => {
                res
                .status(200)
                .redirect('/me/stored/comics/comic-list');
              })
              .catch(next)
          }
        })
        .catch(next)
          
  }

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

  
  // [POST] / me / stored / handle-form-action-for-comic
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

  // /[POST] / me / stored / handle-form-action-for-comics
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
