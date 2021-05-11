const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const User = require('../models/User');
const { singleMongooseToObject, multiMongooseToObject } = require('../../util/mongoose');
const dbHelper = require('./dbHelper')
var { canViewProject, canDeleteProject } = require('../../config/permissions/comics.permission')
class meController {


  async showChapter(req, res, next) {

    var showChapter = await Chapter.findOne({ comicSlug: req.params.slug, chapter: req.params.chapter })
    
    try {

      var comicSlug = req.params.slug
      var currentReadingChapter = req.params.chapter
      var cookie = req.cookies[comicSlug]; //  ['chapter-1', 'chapter-2]}
      
      checkCookie()

      async function checkCookie() {
        
        var hadCookie = (cookie === undefined) ? false : true

        if (hadCookie === false) {

          // Set Cookie
          res.cookie(comicSlug, { chapters: [currentReadingChapter] }, { maxAge: 604800000 })

          // Increase View
          showChapter.view += 1

          // console.log(showChapter.view)

        }
        if (hadCookie === true) {
          
          var checkisViewed = await isViewed(cookie)
          // console.log("checkisview" + checkisViewed)

          if (!checkisViewed) { 
            // check 0 mean not view yet so change oldCookie to new 
            // and increase view

            // Set new Cookie
            
            var currentComicList = cookie
            
            var newComicList = {chapters: appendObjTo(currentComicList, 'chapters', currentReadingChapter)}
          
            res.cookie(comicSlug, newComicList, { maxAge: 604800000 })

            // increase view
            showChapter.view += 1

            // console.log(showChapter.view)
          } // check 1 mean already count so do nothing
        }
      }

      function appendObjTo(thatArray, thatArrayProperty, newObj) {
        const frozenObj = Object.freeze(newObj);
        return Object.freeze(thatArray[thatArrayProperty].concat(frozenObj));
      }

      function isViewed(viewedComicList) {
        var check = viewedComicList.chapters.filter(chapter => {
          return (chapter.includes(currentReadingChapter))
        })
        return (check[0] === currentReadingChapter ) // if check cookie giống chapter đang đọc > true
      }

    } catch (error) {
      next(error)
    }

    showChapter
      .save()
      .then(chapter => {
        res.render('me/showChapter.hbs',
          {
            layout: 'adminMain',
            chapter: singleMongooseToObject(chapter),
          })
      })
      .catch(next);
  }

  /***** Comic Controller *****
  0. default page
  1. Render comic list
  2. Render Create comics
  3. Create comics
  4. Render Edit Page
  5. Update comic
  6. Destroy comic
  7. Handle Form Action Comic
  ***** Comic Controller *****/

  /***** Chapter Controller *****
  8.  Render ChapterList
  9.  Render create Chapter
  10. destroy Chapter
  11. Handle Form Action Chapter
  ***** Chapter Controller *****/




  // 0. default: [GET] / me / stored / comics
  adminDashboard(req, res, next) {

    Promise.all([Comic.find({ $and: [{ title: { $exists: true } }, { chaptername: { $not: { $exists: true } } }] }), Comic.countDocumentsDeleted()
      , User.find({}).select('banned role name _id')]
    )

      .then(([comics, deletedCount, users]) => {
        var userData = users
        res.render('me/Dashboard.Admin.hbs',
          {
            layout: 'admin',
            deletedCount,
            comics: multiMongooseToObject(comics),
            users: multiMongooseToObject(users),
            user: singleMongooseToObject(req.user),
            userData: JSON.stringify(userData),
          })
      }
      )
      .catch(next);
  }

  extraAdminDashboard(req, res, next) {

    Promise.all([Comic.find({ $and: [{ title: { $exists: true } }, { chaptername: { $not: { $exists: true } } }] }), Comic.countDocumentsDeleted()
      , User.find({})]
    )

      .then(([mangas, deletedCount]) =>
        res.render('me/Dashboard.extraAdmin.hbs',
          {
            layout: 'admin',
            deletedCount,
            user: singleMongooseToObject(req.user),
          })
      )
      .catch(next);
  }

  faqPage(req, res, next) {
    res.render('me/faqPage.hbs',
      {
        layout: 'admin',
        user: singleMongooseToObject(req.user),
      })
  }

  // 1. Render comic list: [GET] / me / stored / comics / comic-list  + (/:comicId )
  comicListPage(req, res, next) {
    var comicList = new Object()
    // Tức là role admin và route comic-list của admin
    if (req.user.role == "admin" && req.params.comicId == undefined) {
      comicList = Comic.find({})
    } else {
      // Route comic-list của user. VD: comiclist/6084e73384620a19a88780da
      comicList = Comic.find({ userId: req.params.comicId })
    }

    if (req.query.hasOwnProperty('_sort')) {
      comicList = comicList.sort({
        [req.query.column]: [req.query.type]
      })
    }

    authGetProject(comicList, req, res, next)

    async function authGetProject(comicList, req, res, next) {
      var check = await canViewProject(req.user, comicList)
      if (!check) {
        console.log("not ok")
        res.status(401).redirect('/dashboard')
        req.flash('error-message', 'Bạn không đủ điều kiện để xem nội dung này')
      } else {
        console.log("ok")
        dbHelper.comicListPage_Pagination_Helper(comicList, req, res, next, null)
      }
    }


  }

  // 2. Render Create comics Page: [GET] / me / stored / comics / create
  createComicPage(req, res, next) {
    res.status(200).render('me/Pages.Comic.Create.hbs',
      {
        layout: 'admin',
        user: singleMongooseToObject(req.user),
      });
  }

  // 3. Create comics: [Post] / me / stored / comics / create [create comic]
  createComic(req, res, next) {
    dbHelper.CreateComic_Helper(req, res, next, null)
  };

  // 4. comicEditPage: [GET] / me / stored /comics /:slug / edit
  comicEditPage(req, res, next) {
    dbHelper.comicEditPage_Helper(req, res, next, null)
  }
  // 5. Update comic: [GET] / me / stored / comics / :slug -> update
  updateComic(req, res, next) {
    dbHelper.UpdateComic_Helper(req, res, next, null)

  }

  // 6. Destroy comic: [DELETE] / me / stored / destroyComic / :slug
  async destroyComic(req, res, next) {
    // var comicList = new Object()
    // comicList = await Comic.findOne({ slug: req.params.slug })
    // authDeleteProject(comicList, req, res, next)

    // async function authDeleteProject(comicList, req, res, next) {
    //   var check = await canDeleteProject(req.user, comicList)
    //   if (!check) {
    //     console.log("delete not ok")
    //     res.status(401).redirect('/dashboard')
    //     req.flash('error-message', 'Bạn không đủ điều kiện để delete nội dung này')
    //   } else {
    //     console.log("delete ok")
    //     dbHelper.destroyComic_Helper(req, res, next, null)
    //   }
    // }
    dbHelper.destroyComic_Helper(req, res, next, null)

  }

  // 7. Handle Form Action Comic: [POST] / me / stored / handle-form-action-for-comic
  async handleFormActionForComics(req, res, next) {
    dbHelper.handleFormActionForComics_Helper(req, res, next, null)
  }








  // 8. Render ChapterList: [GET] / me / stored / comics / :slug / chapter-list
  chapterListPage(req, res, next) {
    var chapterList = Chapter.find({ comicSlug: req.params.slug })
    dbHelper.chapterListPage_Helper(chapterList, req, res, next, null)
  }

  // 9. Render create Chapter: [GET] / me / stored / comics / :slug / create-chapter
  createChapterPage(req, res, next) {
    var linkComics = req.params.slug;
    res.status(200).render('me/Pages.Chapter.Create.hbs', {
      layout: 'admin',
      linkComics,
    })
  }

  // 10. destroy Chapter
  destroyChapter(req, res, next) {
    dbHelper.destroyChapter_Helper(req, res, next, null)
  }

  // 11. Handle Form Action Chapter: [POST] / me / stored / handle-form-action-for-comic
  async handleFormActionForChapters(req, res, next) {
    dbHelper.handleFormActionForChapters_Helper(req, res, next, null)
  }

}

//export (SiteController) thì lát require nhận được nó
module.exports = new meController();
