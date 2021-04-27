const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter')
const TimeDifferent = require('../../config/middleware/TimeDifferent')
const removeVietnameseTones = require('../../config/middleware/VnameseToEng');
const trimEng = require('../../config/middleware/trimEng')
const shortid = require('shortid');
const customError = require('../../util/customErrorHandler')
const deleteMiddleWare = require('../middlewares/S3DeleteMiddleware');
const { singleMongooseToObject, multiMongooseToObject } = require('../../util/mongoose');


/***** Comic Controller *****
 
1. comicListPage_Pagination_Helper
2. CreateComic_Helper
3. comicEditPage_Helper
4. UpdateComic_Helper
5. destroyComic_Helper
6. handleFormActionForComics_Helper

***** Comic Controller *****/

/***** Chapter Controller *****
  7. chapterListPage_Helper
  8. destroyChapter_Helper
  9. handleFormActionForChapters_Helper
  ***** Chapter Controller *****/

// 1. comicListPage_Pagination_Helper
const comicListPage_Pagination_Helper = (exports.comicListPage_Pagination_Helper
  = (comicList, req, res, next, msg) => {
    let page = +req.query.page || 1;
    let PageSize = 10;
    let skipCourse = (page - 1) * PageSize;
    let nextPage = +req.query.page + 1 || 2;
    let prevPage = +req.query.page - 1;
    let prevPage2 = +req.query.page - 2;

    comicList
      .skip(skipCourse)
      .limit(PageSize)
      .then((comics) => {
        var noComics = false;
        if (comics.length == 0) { noComics = true }
        Comic.countDocuments((err, count) => {
          if (err) return next(err);
          comics.map(comic => {
            var time = TimeDifferent(comic.updatedAt)
            // console.log(time)
            comic["comicUpdateTime"] = time;
          })
          res.render('me/Pages.Comics.List.hbs',
            {
              layout: 'admin',
              noComics,
              current: page,
              nextPage,
              prevPage,
              prevPage2,
              user: singleMongooseToObject(req.user),
              pages: Math.ceil(count / PageSize),
              comics: multiMongooseToObject(comics),
            })
        })
      })
      .catch(err => console.log(err))
      // .catch(next);
  });


// 2. CreateComic_Helper
const CreateComic_Helper = (exports.CreateComic_Helper
  = (req, res, next, msg) => {

    const { title, description } = req.body;
    let errors = [];

    checkInput(title, description)

    if (errors.length > 0) {
      return res.render('me/Pages.Comic.Create.hbs', {
        layout: 'admin',
        errors,
        title,
        description
      });
    } else {
      return createComic()
    }

    function checkInput(title, description) {
      if (title == '') {
        errors.push({ msg: 'Bạn chưa nhập đủ thông tin truyện' });
      }
    }
    
    function createComic() {
      const slug = removeVietnameseTones(title) //Chuyển title[tiếng việt] sang slug 
      Comic.findOne({ slug: slug })
        .then(comicExisted => {
          if (comicExisted) {
            errors.push({ msg: `Tên truyện "${comicExisted.title}" đã có, vui lòng nhập tên khác` });
            res.render('me/Pages.Comic.Create.hbs', {
              layout: 'admin',
              errors,
              title,
              description
            })
          } else {
            // TH nếu slug CHƯA có
            const comic = new Comic(req.body);
            comic.userId = req.user._id
            comic.userName = req.user.name
            comic.slug = slug;
            comic.titleForSearch = trimEng(comic.title)
            comic.save()
              .then(() => {
                if (req.user.role == "admin") {
                  res
                  .status(201)
                  .redirect('/me/stored/comics/comic-list');
                } else {
                  res
                  .status(201)
                  .redirect(`/me/stored/comics/comic-list/${req.user._id}`);
                }
                req.flash('success-message', `Tạo truyện >>${title}<< thành công`)
              })
              .catch(next);
            }
          })
        .catch(next)
    }

  });

// 3. comicEditPage_Helper
const comicEditPage_Helper = (exports.comicEditPage_Helper
  = (req, res, next, msg) => {
    Comic.find({ slug: req.params.slug })
      .select('title slug createdAt updatedAt description thumbnail')
      .then(comicExisted => {
        if (comicExisted.length == 0) {
          return next(new customError('comic not found', 404));
        }
        Chapter.find({ comicSlug: req.params.slug })
          .select('title slug createdAt updatedAt description comicSlug chapter')
          .then(chapters => {
            res.status(200).render('me/Pages.Comic.edit.hbs', {
              layout: 'admin',
              user: singleMongooseToObject(req.user),
              chapters: multiMongooseToObject(chapters),
              comic: multiMongooseToObject(comicExisted)
            })
          })
          .catch(next);
      })
      .catch(next);
  });

// 4. UpdateComic_Helper
const UpdateComic_Helper = (exports.UpdateComic_Helper
  = (req, res, next, msg) => {

    // //update thumbnail
    // req.body.thumbnail = `https://img.youtube.com/vi/${req.body.videoId}/sddefault.jpg`;
    //update lấy Comic id, chỉnh sửa reg.body
    // tìm tất cả chapter truyện lưu vào biến để lát thay đổi hêt các chaptername
    var newtitle = req.body.title;
    var oldSlug = req.params.slug;
    var newSlug = removeVietnameseTones(newtitle)

    var titleforsearch = { titleForSearch: trimEng(newtitle) }
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
                jsonFile = req.body
                finalReqBody = Object.assign({}, jsonFile, titleforsearch);

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
                jsonFile = req.body
                finalReqBody = Object.assign({}, jsonFile, titleforsearch);

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

  });

// 5. destroyComic_Helper
const destroyComic_Helper = (exports.destroyComic_Helper
  = (req, res, next, msg) => {

    deleteThumbnail_Images_s3().then(() => {
      return Promise.all([delete_Chapters_mongodb(), delete_Comic_mongodb()]);
    }).then((args) => {
      res.status(200).redirect('back');
      req.flash('success-message', 'Xóa truyện thành công !!')
      //console.log(args)
    });
    
    function deleteThumbnail_Images_s3() {
      return new Promise((resolve, reject) => {
        // do something async
        /* -- First task -- */
        Comic.findOne({ slug: req.params.slug }, function (err, comic) {

          console.log("--1 Tiến hành Xóa comic thumbnail trên s3: ")
          if (comic.thumbnail.length == 0) {
            console.log(' --K có thumbnail để xóa')
          }
          else {
            deleteMiddleWare(comic.thumbnail, function (err) {
              if (err) { return next(err) }
            }); /* -- end First task -- */
          }

          console.log("--2 Tiến hành Xóa chapter images trên s3: ")
          Chapter.find({ comicSlug: req.params.slug })
            .then(chapters => {
              if (!chapters) {
                console.log(' --K có chapter images để xóa')
              }
              else {
                chapters.map(chapter => {
                  deleteMiddleWare(chapter.image, function (err) {
                    if (err) { return next(err) }
                  });
                })
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

    function delete_Chapters_mongodb() {
      return new Promise((resolve, reject) => {
        // do something async
        /* -- Third task -- */
        console.log("--3 Tiến hành Xóa chapters trên mongodb: ")
        Chapter.deleteMany({ comicSlug: req.params.slug })
          .then((result) => {
            resolve(result);
          })
          .catch(next) /* -- end Third task -- */
      })
    }

    function delete_Comic_mongodb() {
      return new Promise((resolve, reject) => {
        // do something async
        /* -- Fourth task -- */
        console.log("--4 Tiến hành Xóa comic trên mongodb: ")
        Comic.deleteOne({ slug: req.params.slug })
          .then((result) => {
            resolve(result);
          })
          .catch(next) /* -- end Fourth task -- */
      });
    }

  });

// 6. handleFormActionForComics_Helper
const handleFormActionForComics_Helper = (exports.handleFormActionForComics_Helper
  = (req, res, next, msg) => {

    var chapterExisted = true;
    switch (req.body.action) {
      case 'delete':
        //comicSlugs là biến đã đặt trong html
        var comicSlugs = req.body.comicSlug;
        if (!comicSlugs) {
          req.flash('error-message', 'Bạn chưa chọn truyện')
          res.status(404).redirect('back');
        } else {
          
          delete_Thumbnail_Images_s3().then(() => {
            delete_Comic_Chapter_mongodb()
          })
          
        }

        async function delete_Thumbnail_Images_s3() {
            comicSlugs.map(comicSlug => {
              console.log(comicSlug) //test-qP64bRH31 //test-d00cQa9fo
              Comic.findOne({ slug: comicSlug }, function (err, comic) {
    
                console.log("--1 Tiến hành Xóa comic thumbnail trên s3: ")
                if (comic.thumbnail.length == 0) {
                  console.log(' --K có thumbnail để xóa')
                }
                else {
                  deleteMiddleWare(comic.thumbnail, function (err) {
                    if (err) { return next(err) }
                  }); /* -- end First task -- */
                }
    
                console.log("--2 Tiến hành Xóa chapter images trên s3: ")
                Chapter.find({ comicSlug: comicSlug })
                  .then(chapters => {
                    if (chapters.length == 0) {
                      console.log(' --K có chapter images để xóa')
                    } else {
                      chapters.map(chapter => {
                        deleteMiddleWare(chapter.image, function (err) {
                          if (err) { return next(err) }
                        });
                      })
                    }
                  })
                  .catch(next)
              })
            })
        } 
        
        async function delete_Comic_Chapter_mongodb() {
            //reg.body.comicSlug là mảng[ ]
            // xóa comic trên mongodb
              Comic.deleteMany({ slug: { $in: req.body.comicSlug } })
                .then(() => {
                  res.status(200);
                })
                .catch(next)
              if (chapterExisted == true) {
                Chapter.deleteMany({ comicSlug: { $in: req.body.comicSlug } })
                  .then(() => {
                    res.status(200).redirect('back');
                    req.flash('success-message', 'Xóa truyện thành công !!')
                  })
                  .catch(next)
              }
        }

        break;
      default:
        req.flash('error-message', 'Action không hợp lệ')
        res.status(404).redirect('back')
    }
  });

// 7. chapterListPage_Helper
const chapterListPage_Helper = (exports.chapterListPage_Helper
  = (chapterList, req, res, next, msg) => {
    let page = +req.query.page || 1;
    let PageSize = 10;
    let skipCourse = (page - 1) * PageSize;
    let nextPage = +req.query.page + 1 || 2;
    let prevPage = +req.query.page - 1;
    let prevPage2 = +req.query.page - 2;

    chapterList
      .select('title chapterSlug createdAt updatedAt description thumbnail comicSlug chapter')
      .skip(skipCourse)
      .limit(PageSize)
      .then((chapters) => {
        var noChapters = false;
        if (chapters.length == 0) { noChapters = true }
        if (chapters) {
          var linkComics = req.params.slug;
          chapters.map(chapter => {
            var time = TimeDifferent(chapter.updatedAt)
            chapter["chapterUpdateTime"] = time;
          })
          res.status(200).render('me/Pages.Chapter.List.hbs', {
            layout: 'admin',
            linkComics,
            noChapters,
            current: page,
            nextPage,
            prevPage,
            prevPage2,
            pages: Math.ceil(chapters.length / PageSize),
            chapters: multiMongooseToObject(chapters)
          })
        }
      })
      .catch(next);
  });

// 8. destroyChapter_Helper
const destroyChapter_Helper = (exports.destroyChapter_Helper
  = (req, res, next, msg) => {

    delete_Chapter_Images_s3().then(() => {
      delete_Chapter_mongodb()
    })


    async function delete_Chapter_Images_s3() {
      Chapter.findOne({ chapterSlug: req.params.slug }, function (err, currentChapter) {
        // return res.json(chapter)
        console.log("-- 1.Tiến hành Xóa chapter images trên s3" + " [" + currentChapter.chapter + "]:")

        deleteMiddleWare(currentChapter.image, function (err) {
          if (err) { return next(err) }
        });
      });
    }

    async function delete_Chapter_mongodb() {
      Chapter.deleteOne({ chapterSlug: req.params.slug }) //slug của chapters
        .then(() => {
          res.status(200).redirect('back');
          req.flash('success-message', 'Xóa Chapter Thành Công')
        })
        .catch(next)
    }


  })


// 9. handleFormActionForChapters_Helper
const handleFormActionForChapters_Helper = (exports.handleFormActionForChapters_Helper
  = async (req, res, next, msg) => {
    switch (req.body.action) {
      case 'delete':

        
        //chapterSlugs là biến đã đặt trong html
        var chapterSlugs = req.body.chapterSlug;
        if (!chapterSlugs) {
          req.flash('error-message', 'Bạn chưa chọn chapter')
          res.status(404).redirect('back');
        } else {

          delete_Chapter_Images_s3()
          delete_Chapter_mongodb()

        }

        async function delete_Chapter_Images_s3() {
          chapterSlugs.map(chapterSlug => {
            Chapter.findOne({ chapterSlug: chapterSlug })
              .then(currentChapter => {
                // Nếu image length > 0 thì tức là có chapter image
                if (!currentChapter) {
                  console.log(' --K có chapter để xóa')
                } else {
                  console.log("-- 2.Tiến hành Xóa chapter images trên s3" + " [" + currentChapter.chapter + "]:")
                  deleteMiddleWare(currentChapter.image, function (err) {
                    if (err) { return next(err) }
                  })
                }
              }).catch(next)
          })
        }

        async function delete_Chapter_mongodb() {
          Chapter.deleteMany({ chapterSlug: { $in: req.body.chapterSlug } })
            .then(() => {
              res.status(200).redirect('back');
              req.flash('success-message', 'Xóa Chapter Thành Công')
            })
            .catch(next)
        }

        break;
      default:
        req.flash('error-message', 'Action không hợp lệ')
        res.status(404).redirect('back')
    }
  });