const Comic  = require('../models/Comic');
const shortid = require('shortid');
const cloudinary = require('../../config/middleware/ModelCloudinary')
const { singleMongooseToObject, multiMongooseToObject } = require('../../util/mongoose');
const   removeVietnameseTones                           = require('../../config/middleware/VnameseToEng');
class MangaController {

  // [GET] / Comics / :slug
  showMangaDetails(req, res, next) {
    Comic.find({slug: req.params.slug})
    .select('title slug createdAt updatedAt description thumbnail chaptername chapter ')
    .then (manga => {
      if(manga) {
        Comic.find({chaptername: req.params.slug})
        .select('title slug createdAt updatedAt description thumbnail chaptername chapter')
        .then(chapters => {  
          if (chapters) {
            res.status(200).render('Comics/showMangaDetails', { 
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

   // [GET] / Comics / :slug / :chapter-x
  showChapterDetails(req, res, next) {
    //req.params.slug VD: Comics/abc 
    //findOne: tìm đến 1 field trong mongodb ở đây là field slug
    //  Comics/nodejs
    Comic.findOne({ $and: [ { chaptername: req.params.slug },{ chapter: req.params.chapter }]})
      .then(Comic => {
        //res.json(Comic)
        if (Comic) {
        res.status(200).render('Comics/showChapterDetails', { Comic: singleMongooseToObject(Comic) })
      
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


  // [GET] / Comics / create || render trang đăng khóa học
  renderCreate(req, res, next) {
    res.status(200).render('Comics/create');
  }

   // [GET] / Comics / upload || render trang upload
   renderUpload(req, res, next) {
    res.status(200).render('Comics/upload');
  }

  // [POST] / Comics / createTruyen || post dữ liệu lên stored:đăng khóa học
  // post dữ liệu lên mongodb, ở me / stored / Comics thì render ra 
  createTruyen(req, res, next) {
    //req.body: là tài nguyên form người dùng nhập vào
    //lấy thumbnail ảnh qua video id youtube

    //req.body.thumbnail = `https://img.youtube.com/vi/${req.body.videoId}/sddefault.jpg`;
    //gán tài nguyên khóa học đơn này vào biến Comic mới rồi save lại
    //const Comic = new Comic(req.body);
    //Chuyển title[tiếng việt] sang slug 
    var title = req.body.title;
    var slug = removeVietnameseTones(title)
    //tra cái slug này xem có cái page nào k
    Comic.findOne({ slug: slug }, function(err, page) {
      if(page) {
        // TH nếu slug ĐÃ có
        console.log('slug existed, add shortId to create new slug');
        const Comic = new Comic(req.body);
        Comic.slug = slug + '-' + shortid.generate();
        Comic.save()
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
      else {
        // TH nếu slug CHƯA có
        const Comic = new Comic(req.body);
        Comic.slug = slug;
        //save xong rồi redirect qua trang chủ
        Comic.save()
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

  
   // [GET] / Comics / :slug / uploadChapter
   //{$or: [{"chaptername": req.params.slug}, {"slug": req.params.slug}]
   uploadChapter(req, res, next) {
     Promise.all([Comic.find({ $or: [{ "chaptername": req.params.slug }, { "slug": req.params.slug }] })
       , Comic.countDocuments({ chapter: { $exists: true } })])
       //.select('title slug createdAt updatedAt description thumbnail chaptername chapter')
       .then(([chapters, countedChapter]) => {
         //res.json( Comics)
         if (chapters) {
           res.status(200).render('Comics/uploadChapter', {
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

   // [GET] / Comics / :slug / edit
  edit(req, res, next) {
    //lấy dữ liệu để vào edit (Comic này là biến trong model)
    Comic.findOne({ slug: req.params.slug })
      .then(manga => res.status(200).render('Comics/editTruyenTranh', {
        manga: singleMongooseToObject(manga)
      }))
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  }

  //Phương thức [PUT]:để chỉnh sửa nhưng chưa hỗ trợ nên sử dụng [PUT]
  //sẽ bị chuyển thành [GET] nên h phải dùng middleware setup bên file index.js
  // [PUT] / Comics / :id 
  update(req, res, next) {
    // //update thumbnail
    // req.body.thumbnail = `https://img.youtube.com/vi/${req.body.videoId}/sddefault.jpg`;
    //update lấy Comic id, chỉnh sửa reg.body
    // tìm tất cả chapter truyện lưu vào biến để lát thay đổi hêt các chaptername
    var newtitle = req.body.title; 
    var oldSlug = req.params.slug;
    var newSlug = removeVietnameseTones(newtitle) 
    Comic.find({ chaptername: req.params.slug })
    .select("chaptername chapter")
    .then(
      Comic.findOne({ slug: req.params.slug }, function(err, page) {
        if (newtitle !== page.title) {

          // TH1: slug hiện tại:khoa-hoc-dinh-cap, muốn chỉnh tên lại: khoa-hoc-dinh, TH này thay tên slug cũ = slug mới
          // TH2: đã có slug này trong mongodb: khoa-hoc-dinh-cap || slug hiện tại:khoa-hoc-dinh, muốn chỉnh tên lại: khoa-hoc-dinh-cap (trùng tên slug), TH này +shortid
          // Nếu title mới khác title cũ thì update lại luôn cả slug
          // check slug mới có trùng slug mongodb thì add shortId vào slug mới
          // newSlug = khoa-hoc-dinh-cao || page.slug = khoa-hoc-dinh
  
          Comic.findOne({ slug: newSlug }, function(err, slugcheck) {
            // tra cái slug mới xem có slugcheck nào có chưa 
            // nếu slug mới mà có sử dụng r` thì slug cũ = slug mới + shortId
            if (slugcheck) {
              // res.json(slugcheck)
              // đổi slug cũ sang slug mới 
              req.body.slug = newSlug + '-' + shortid.generate();
              Comic.updateMany({ chaptername: oldSlug }, {chaptername: req.body.slug})
              .select("chaptername")
              .then(result => {
                  console.log(result)
              })
              Comic.updateOne({ slug: req.params.slug }, req.body)
                .then(() => {
                  res.status(200).redirect('/me/stored/manga');
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
              Comic.updateMany({ chaptername: oldSlug }, {chaptername: newSlug})
              .select("chaptername")
              .then(result => {
                  console.log(result)
              })
              Comic.updateOne({ slug: req.params.slug }, req.body)
                .then(() => {
                  res.status(200).redirect('/me/stored/manga');
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
            res.status(200).redirect('/me/stored/manga');
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

  // [PATCH] / Comics / :id 
  // (phương thức HOẠT ĐỘNG là khi bấm nút khôi phục hãy submit form 
  // với route:[PATCH] / Comics / :id)
  restore(req, res, next) {
    Comic.restore({ slug: req.params.slug })
      .then(() => {
        res.status(200).redirect('back');
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  }

  // [DELETE] / Comics / :slug 
  async destroy(req, res, next) {
    // dùng delete của plugin sofl delete
    await Comic.findOne({ slug: req.params.slug }, function (err, page) {
      // Xem page có chưa chaptername ko: 
      // - nếu có nghĩa là delete chapter: delete thêm cả ảnh trên databse
      //res.json(page.chaptername)
      if (page.chaptername) // check có phải chapter không 
      // -> chỉ delete chapters -> delete chapters mongodb
      {
        console.log("vào if 1")
            page.image.map(image => {
            let imagePublicId = image.publicId
            //res.json(imagePublicId)
            cloudinary.deleteMultiple(imagePublicId)
              .then(result => {
                console.log("-- Xóa images trên cloudinary: ")
                console.log(result)
              })
              .catch((error) => {
                console.error('> Error>', error);
              })

            Comic.deleteOne({ slug: req.params.slug }) //slug của chapters
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
      } else {
        // check có phải manga không 
        // -> delete thumbnail cloudinary ->  delete all chapter images cloudinary 
        // -> delete manga mongodb -> delete all chapters mongodb
        console.log("vào if 2")
        
        function getPromise1_2() {
          return new Promise((resolve, reject) => {
            // do something async
            /* -- First task -- */
            console.log("--1 Tiến hành Xóa thumbnail trên cloudinary: ")
            if (page.thumbnail.length !== 0) {
              console.log("err")
              page.thumbnail.map(thumbnail => {
                cloudinary.deleteMultiple(thumbnail.publicId)
                  .then(result => {
                    console.log(result)
                  })
                  .catch((error) => {
                    console.error('> Error>', error);
                  })
              }); /* -- end First task -- */
            }
            else {
              console.log(' --K có thumbnail để xóa')
            }
           
            console.log("--2 Tiến hành Xóa images trên cloudinary: ")
            Comic.find({ chaptername: req.params.slug })
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
                  console.log(' --K có images để xóa')
                }
             })

             //resolve bên dưới này nếu để bên trên là hàm chạy chưa hết
             //resolve như return
             .then(result => {
              resolve(result)
            })
          });
        }
    
        function getPromise3() {
         
          return new Promise((resolve, reject) => {
            // do something async
            /* -- Third task -- */
            console.log("--3 Tiến hành Xóa chapters trên mongodb: ")
            Comic.deleteMany({ chaptername: req.params.slug })
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
            console.log("--4 Tiến hành Xóa manga trên mongodb: ")
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
      } //end else
    });
  }

  // [DELETE] / Comics / /force /:slug 
  forceDestroy(req, res, next) {
    // - nếu không nghĩa là force delete truyen: delete binh thường
    Comic.deleteOne({ slug: req.params.slug })
      .then(() => {
        res.status(200).redirect('back');
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  }

  // /[POST] / manga / handle-form-action
  async handleFormAction(req, res, next) {
    //res.json(req.body)
    switch (req.body.action) {
      case 'delete':
        var chapterSlugs = req.body.chapterSlug;
       await chapterSlugs.map(chapterslug => {
          //console.log(chapterslug) //test-qP64bRH31 //test-d00cQa9fo
          Comic.findOne({ slug: chapterslug }, function (err, currentChapter) {
            currentChapter.image.map(chapterImage => {
              cloudinary.deleteMultiple(chapterImage.publicId)
              .then(result => {
                console.log(result)
              })
              .catch((error) => {
                console.error('> Error>', error);
              })

            })
          }); 
        })
           //reg.body.chapterSlug là mảng[ ]
          Comic.deleteMany({ slug: { $in: req.body.chapterSlug } })
          .then(() => {
            res.status(200).redirect('back');
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({
              error: err
            });
          })
        break;
      default:
        res.json({ message: 'action is invalid' })
    }
  }
}

//export (SiteController) thì lát require nhận được nó
module.exports = new MangaController();
