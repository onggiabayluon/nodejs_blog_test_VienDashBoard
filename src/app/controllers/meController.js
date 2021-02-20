const Course  = require('../models/Course');
const shortid = require('shortid');
const { singleMongooseToObject, multiMongooseToObject } = require('../../util/mongoose');
const removeVietnameseTones  = require('../../config/middleware/VnameseToEng');
const TimeDifferent = require('../../config/middleware/TimeDifferent')
class meController {


  // [GET] / me / stored / manga / :slug
  storedAllChapter(req, res, next) {
    Course.find({ chaptername: req.params.slug })
      //.select('title slug createdAt updatedAt description thumbnail chaptername chapter')
      .then((chapters) => {
        if (chapters) {
          console.log(Object.keys(chapters).length === 0);// true  
          if ((Object.keys(chapters).length === 0) === true) { // object rỗng sẽ ra true
            var noChapters = true;
            res.status(200).render('me/stored-AllChapter', {
              chapters,
              noChapters
            })
          } else {
            res.status(200).render('me/stored-AllChapter', {
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

  // [GET] / me / stored / manga
  storedTruyenTranhs(req, res, next) {

    Promise.all([Course.find({ $and: [{ title: { $exists: true } }, { chaptername: { $not: { $exists: true } } }] }), Course.countDocumentsDeleted()]
    )

      .then(([mangas, deletedCount]) =>
        res.render('me/stored-AllManga', {
          deletedCount,
          mangas: multiMongooseToObject(mangas),
        })
      )
      .catch(next);
  }


  /*
  1. Render Admin Home
  */
  // [GET] / me / stored / comics
  storedComics(req, res, next) {

    Promise.all([Course.find({ $and: [{ title: { $exists: true } }, { chaptername: { $not: { $exists: true } } }] }), Course.countDocumentsDeleted()]
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

    Promise.all([Course.find({ $and: [{ title: { $exists: true } }, { chaptername: { $not: { $exists: true } } }] }), Course.countDocumentsDeleted()]
    )

      .then(([mangas, deletedCount]) => 
      {
        mangas.map(manga => {
          var time = TimeDifferent(manga.updatedAt)
          //console.log(time)
          manga["mangaUpdateTime"] = time;
        })
        //console.log(mangas)
        res.render('me/Pages.Comics.List.hbs',
        {
          layout: 'admin',
          deletedCount,
          mangas: multiMongooseToObject(mangas),
        })
      })
      .catch(next);
  }

  /*
  2.2 Render ChapterList
  */
  // [GET] / me / stored / comics / :slug / chapter-list
  getChapterList(req, res, next) {
    Course.find({ chaptername: req.params.slug })
      .select('title slug createdAt updatedAt description thumbnail chaptername chapter')
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
              chapter["mangaUpdateTime"] = time;
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
    Promise.all([Course.find({ $or: [{ "chaptername": req.params.slug }, { "slug": req.params.slug }] })
      , Course.countDocuments({ chapter: { $exists: true } })])
      //.select('title slug createdAt updatedAt description thumbnail chaptername chapter')
      .then(([chapters, countedChapter]) => {
        //res.json( courses)
        if (chapters) {
          var linkComics = req.params.slug;
          res.status(200).render('me/Pages.Chapter.Create.hbs', {
            layout: 'admin',
            linkComics,
            countedChapter,
            chapters: multiMongooseToObject(chapters)
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
  // [Post] / me / stored / comics / create
  createComic(req, res, next) {
    //req.body: là tài nguyên form người dùng nhập vào
    //lấy thumbnail ảnh qua video id youtube

    //req.body.thumbnail = `https://img.youtube.com/vi/${req.body.videoId}/sddefault.jpg`;
    //gán tài nguyên khóa học đơn này vào biến course mới rồi save lại
    //const course = new Course(req.body);
    //Chuyển title[tiếng việt] sang slug 
    var title = req.body.title;
    var slug = removeVietnameseTones(title)
    //tra cái slug này xem có cái page nào k
    Course.findOne({ slug: slug }, function (err, page) {
      if (page) {
        // TH nếu slug ĐÃ có
        console.log('slug existed, add shortId to create new slug');
        const course = new Course(req.body);
        course.slug = slug + '-' + shortid.generate();
        course.save()
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
        const course = new Course(req.body);
        course.slug = slug;
        //save xong rồi redirect qua trang chủ
        course.save()
          .then(() => {
            res.status(201).redirect('/me/stored/manga');
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
    Course.find({ slug: req.params.slug })
      .select('title slug createdAt updatedAt description thumbnail chaptername chapter ')
      .then(manga => {
        if (manga) {
          Course.find({ chaptername: req.params.slug })
            .select('title slug createdAt updatedAt description thumbnail chaptername chapter')
            .then(chapters => {
              if (chapters) {
                res.status(200).render('me/Pages.Comic.edit.hbs', {
                  layout: 'admin',
                  chapters: multiMongooseToObject(chapters),
                  manga: multiMongooseToObject(manga)
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
    //update lấy course id, chỉnh sửa reg.body
    // tìm tất cả chapter truyện lưu vào biến để lát thay đổi hêt các chaptername
    var newtitle = req.body.title;
    var oldSlug = req.params.slug;
    var newSlug = removeVietnameseTones(newtitle)
    Course.find({ chaptername: req.params.slug })
      .select("chaptername chapter")
      .then(
        Course.findOne({ slug: req.params.slug }, function (err, page) {
          if (newtitle !== page.title) {

            // TH1: slug hiện tại:khoa-hoc-dinh-cap, muốn chỉnh tên lại: khoa-hoc-dinh, TH này thay tên slug cũ = slug mới
            // TH2: đã có slug này trong mongodb: khoa-hoc-dinh-cap || slug hiện tại:khoa-hoc-dinh, muốn chỉnh tên lại: khoa-hoc-dinh-cap (trùng tên slug), TH này +shortid
            // Nếu title mới khác title cũ thì update lại luôn cả slug
            // check slug mới có trùng slug mongodb thì add shortId vào slug mới
            // newSlug = khoa-hoc-dinh-cao || page.slug = khoa-hoc-dinh

            Course.findOne({ slug: newSlug }, function (err, slugcheck) {
              // tra cái slug mới xem có slugcheck nào có chưa 
              // nếu slug mới mà có sử dụng r` thì slug cũ = slug mới + shortId
              if (slugcheck) {
                // res.json(slugcheck)
                // đổi slug cũ sang slug mới 
                req.body.slug = newSlug + '-' + shortid.generate();
                Course.updateMany({ chaptername: oldSlug }, { chaptername: req.body.slug })
                  .select("chaptername")
                  .then(result => {
                    console.log(result)
                  })
                Course.updateOne({ slug: req.params.slug }, req.body)
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
                Course.updateMany({ chaptername: oldSlug }, { chaptername: newSlug })
                  .select("chaptername")
                  .then(result => {
                    console.log(result)
                  })
                Course.updateOne({ slug: req.params.slug }, req.body)
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
            Course.updateOne({ slug: req.params.slug }, req.body)
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
      )
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  }
  // // [GET] / me / trash / manga
  // trashTruyenTranhs(req, res, next) {
  //     Course.findDeleted({})  
  //         .then(courses => res.render('me/trash-manga', {
  //                 courses: multiMongooseToObject(courses)
  //             }))
  //             .catch(next);
  // }

  //  // [GET] / me / trash / allChapter / :slug
  //  trashChapters(req, res, next) {
  //     Course.findDeleted({ chaptername: req.params.slug })  
  //         .then(courses => res.render('me/trash-AllChapter', {
  //                 courses: multiMongooseToObject(courses)
  //             }))
  //             .catch(next);
  // }
}

//export (SiteController) thì lát require nhận được nó
module.exports = new meController();
