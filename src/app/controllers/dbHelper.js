const Comic                     = require('../models/Comic');
const Chapter                   = require('../models/Chapter')
const TimeDifferent             = require('../../config/middleware/TimeDifferent')
const removeVietnameseTones     = require('../../config/middleware/VnameseToEng');
const trimEng                   = require('../../config/middleware/trimEng')
const shortid                   = require('shortid');
const customError               = require('../../util/customErrorHandler')
const { singleMongooseToObject, multiMongooseToObject } = require('../../util/mongoose');


/***** Comic Controller *****
 
1. GetComicList_Pagination_Helper
2. CreateComic_Helper
3. RenderComicEdit_Helper
4. UpdateComic_Helper

***** Comic Controller *****/

// 1. GetComicList_Pagination_Helper
const GetComicList_Pagination_Helper = (exports.GetComicList_Pagination_Helper 
    = (comicList, req, res, msg) => {
    let page = +req.query.page || 1;
    let PageSize = 2;
    let skipCourse = (page - 1) * PageSize;
    let nextPage = +req.query.page + 1 || 2;
    let prevPage = +req.query.page - 1;
    let prevPage2 = +req.query.page - 2;

    comicList
    .skip(skipCourse)
    .limit(PageSize)
    .exec((err, comics) => {
      if (err) return next(err);
      Comic.countDocuments((err, count) => {
        if (err) return next(err);
        comics.map(comic => {
          var time = TimeDifferent(comic.updatedAt)
          // console.log(time)
          comic["comicUpdateTime"] = time;
        })
          res.render('me/Pages.Comics.List.hbs',
          {
            layout: 'admin_copy_2',
            current: page,
            nextPage,
            prevPage,
            prevPage2,
            pages: Math.ceil(count / PageSize),
            comics: multiMongooseToObject(comics),
          })
        })
      })
  });


// 2. CreateComic_Helper
const CreateComic_Helper = (exports.CreateComic_Helper 
    = (req, res, next, msg) => {
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
});

// 3. RenderComicEdit_Helper
const RenderComicEdit_Helper = (exports.RenderComicEdit_Helper 
  = (req, res, next, msg) => {
    Comic.find({ slug: req.params.slug })
    .select('title slug createdAt updatedAt description thumbnail')
    .then(comicExisted => {
      if (comicExisted.length == 0) {
        return next(new customError('comic not found' , 404));
      }
        Chapter.find({ comicSlug: req.params.slug })
          .select('title slug createdAt updatedAt description comicSlug chapter')
          .then(chapters => {
              res.status(200).render('me/Pages.Comic.edit.hbs', {
                layout: 'admin',
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