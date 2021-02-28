const Comic  = require('../models/Comic');
const Chapter = require('../models/Chapter')
const shortid = require('shortid');
const cloudinary = require('../../config/middleware/ModelCloudinary')
const { singleMongooseToObject, multiMongooseToObject } = require('../../util/mongoose');
const removeVietnameseTones  = require('../../config/middleware/VnameseToEng');
const TimeDifferent = require('../../config/middleware/TimeDifferent')
class meController {


  showChapter(req,res,next) {
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
          var linkComics = req.params.slug;
          //res.json(chapters)
          //console.log(Object.keys(chapters).length === 0);// true  
          if ((Object.keys(chapters).length === 0) === true) { // object rỗng sẽ ra true
            var noChapters = true;
            
            res.status(200).render('me/Pages.Comics.ChapterList.hbs', {
              layout: 'admin',
              linkComics,
              chapters,
              noChapters
            })
          } else {
            chapters.map(chapter => {
              var time = TimeDifferent(chapter.updatedAt)
              //console.log(time)
              chapter["chapterUpdateTime"] = time;
            })
            res.status(200).render('me/Pages.Comics.ChapterList.hbs', {
              layout: 'admin',
              linkComics,
              chapters: multiMongooseToObject(chapters)
            })
          }
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

   /*
  2.3 Render create Chapter
  */
  // [GET] / me / stored / comics / :slug / create-chapter
  renderCreateChapter(req, res, next) {
    // Promise.all([Comic.find({ $or: [{ "chaptername": req.params.slug }, { "slug": req.params.slug }] })
    //   , Comic.countDocuments({ chapter: { $exists: true } })])
    //   //.select('title slug createdAt updatedAt description thumbnail chaptername chapter')
    //   .then(([chapters, countedChapter]) => {
        //res.json( Comics)
        
          var linkComics = req.params.slug;
          res.status(200).render('me/Pages.Chapter.Create.hbs', {
            layout: 'admin',
            linkComics,
            // countedChapter,
            // chapters: multiMongooseToObject(chapters)
          })
  
  }

  /*
  3. Render Create Page
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
    //req.body: là tài nguyên form người dùng nhập vào
    //lấy thumbnail ảnh qua video id youtube

    //req.body.thumbnail = `https://img.youtube.com/vi/${req.body.videoId}/sddefault.jpg`;
    //gán tài nguyên khóa học đơn này vào biến Comic mới rồi save lại
    //const Comic = new Comic(req.body);
    //Chuyển title[tiếng việt] sang slug 
    var title = req.body.title;
    var slug = removeVietnameseTones(title)
    console.log(slug)
    //tra cái slug này xem có cái page nào k
    Comic.findOne({ slug: slug }, function (err, comicExisted) {
      if (comicExisted) {
        // TH nếu slug ĐÃ có
        console.log('slug existed, add shortId to create new slug');
        const comic = new Comic(req.body);
        comic.slug = slug + '-' + shortid.generate();
        comic.save()
          .then(() => {
            res.status(201).redirect('/me/stored/comics/comic-list');
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({
              error: err
            });
          });
      }
      else {
        // TH nếu slug CHƯA có
        const comic = new Comic(req.body);
        comic.slug = slug;
        //save xong rồi redirect qua trang chủ
        comic.save()
          .then(() => {
            res.status(201).redirect('/me/stored/comics/comic-list');
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({
              error: err
            });
          });
      }
    })
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
    
        Comic.findOne({ slug: req.params.slug }, function (err, page) {
          if (newtitle !== page.title) {

            // TH1: slug hiện tại:khoa-hoc-dinh-cap, muốn chỉnh tên lại: khoa-hoc-dinh, TH này thay tên slug cũ = slug mới
            // TH2: đã có slug này trong mongodb: khoa-hoc-dinh-cap || slug hiện tại:khoa-hoc-dinh, muốn chỉnh tên lại: khoa-hoc-dinh-cap (trùng tên slug), TH này +shortid
            // Nếu title mới khác title cũ thì update lại luôn cả slug
            // check slug mới có trùng slug mongodb thì add shortId vào slug mới
            // newSlug = khoa-hoc-dinh-cao || page.slug = khoa-hoc-dinh

            Comic.findOne({ slug: newSlug }, function (err, slugExisted) {
              // tra cái slug mới xem có slugcheck nào có chưa 
              // nếu slug mới mà có sử dụng r` thì slug cũ = slug mới + shortId
              if (slugExisted) {
                // res.json(slugcheck)
                // đổi slug cũ sang slug mới 
                req.body.slug = newSlug + '-' + shortid.generate();
                Chapter.updateMany({ comicSlug: oldSlug }, { comicSlug: req.body.slug })
                  .select("comicSlug")
                  .then(result => {
                    console.log(result)
                  })
                Comic.updateOne({ slug: req.params.slug }, req.body)
                  .then(() => {
                    res.status(200).redirect('/me/stored/comics/comic-list');
                  })
                  .catch(err => {
                    console.log(err);
                    res.status(500).json({
                      error: err
                    });
                  });
              } else {
                // nếu slug mới chưa có sử dụng thì slug cũ = slug mới
                req.body.slug = newSlug;
                Chapter.updateMany({ comicSlug: oldSlug }, { comicSlug: newSlug })
                  .select("comicSlug")
                  .then(result => {
                    console.log(result)
                  })
                Comic.updateOne({ slug: req.params.slug }, req.body)
                  .then(() => {
                    res.status(200).redirect('/me/stored/comics/comic-list');
                  })
                  .catch(err => {
                    console.log(err);
                    res.status(500).json({
                      error: err
                    });
                  });
              }
            });
          } else {
            // Nếu title mới giống title cũ thì update bình thường, không update slug
            Comic.updateOne({ slug: req.params.slug }, req.body)
              .then(() => {
                res.status(200).redirect('/me/stored/comics/comic-list');
              })
              .catch(err => {
                console.log(err);
                res.status(500).json({
                  error: err
                });
              });
          }
        })
     
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
                .catch((error) => {
                  console.error('> Error>', error);
                })
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
                      .catch((error) => {
                        console.error('> Error>', error);
                      })
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
          .catch(err => {
            console.log(err);
            res.status(500).json({
              error: err
            });
          }); /* -- end Third task -- */
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
          .catch(err => {
            console.log(err);
            res.status(500).json({
              error: err
            });
          });   /* -- end Fourth task -- */
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
          .catch((error) => {
            console.error('> Error>', error);
          })
        });
        Chapter.deleteOne({ chapterSlug: req.params.slug }) //slug của chapters
          .then(() => {
            console.log("-- Xóa images trên mongodb: ")
            res.status(200).redirect('back');
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({
              error: err
            });
          })
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
          console.log('Bạn chưa chọn truyện ')
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
                    .catch((error) => {
                      console.error('> Error>', error);
                    })
                }); /* -- end First task -- */
              }
            });
            Chapter.findOne({ comicSlug: comicSlug }, function (err, currentChapter) {
              // Nếu image length > 0 thì tức là có chapter image
              console.log("-- 2.Tiến hành Xóa chapter images trên cloudinary" + " [" + currentChapter.chapter + "]:")
              if (!currentChapter) {
                chapterExisted = false;
                console.log(' --K có chapter để xóa')
              }
              else {
                currentChapter.image.map(chapterImage => {
                  cloudinary.deleteMultiple(chapterImage.publicId)
                    .then(result => {
                      console.log(result)
                    })
                    .catch((error) => {
                      console.error('> Error>', error);
                    })
                })
              }
            })
  
          })
  
          
          //reg.body.comicSlug là mảng[ ]
          Comic.deleteMany({ slug: { $in: req.body.comicSlug } })
            .then(() => {
              res.status(200);
            })
            .catch(err => {
              console.log(err);
              res.status(500).json({
                error: err
              });
            })
            console.log(chapterExisted)
          if (chapterExisted == true) {
            Chapter.deleteMany({ comicSlug: { $in: req.body.comicSlug } })
            .then(() => {
              res.status(200).redirect('back');
            })
            .catch(err => {
              console.log(err);
              res.status(500).json({
                error: err
              });
            })
          }

        }
         
        
        break;
      default:
        res.json({ message: 'Action Không hợp lệ ' })
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
          console.log('Bạn chưa chọn chapter ')
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
                    .catch((error) => {
                      console.error('> Error>', error);
                    })
                })
              }
            })
  
          })
  
            Chapter.deleteMany({ chapterSlug: { $in: req.body.chapterSlug } })
            .then(() => {
              res.status(200).redirect('back');
            })
            .catch(err => {
              console.log(err);
              res.status(500).json({
                error: err
              });
            })

        }
         
        
        break;
      default:
        res.json({ message: 'Action Không hợp lệ ' })
    }
  }

}

//export (SiteController) thì lát require nhận được nó
module.exports = new meController();
