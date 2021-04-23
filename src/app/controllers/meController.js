const Comic       = require('../models/Comic');
const Chapter     = require('../models/Chapter');
const shortid     = require('shortid');
const cloudinary  = require('../../config/middleware/ModelCloudinary')
const trimEng     = require('../../config/middleware/trimEng')
const { singleMongooseToObject, multiMongooseToObject } = require('../../util/mongoose');
const removeVietnameseTones  = require('../../config/middleware/VnameseToEng');
const TimeDifferent   = require('../../config/middleware/TimeDifferent')
const dbHelper        = require('./dbHelper')
const { db } = require('../models/Comic');
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

    dbHelper.GetComicList_Pagination_Helper(comicList, req, res, next, null)
    
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
    dbHelper.destroyComic_Helper(req, res, next, null)
  } 
  
  // 7. Handle Form Action Comic: [POST] / me / stored / handle-form-action-for-comic
  async handleFormActionForComics(req, res, next) {
    dbHelper.handleFormActionForComics_Helper(req, res, next, null)
  }







  
  // 8. Render ChapterList: [GET] / me / stored / comics / :slug / chapter-list
  getChapterList(req, res, next) {
    var chapterList = Chapter.find({ comicSlug: req.params.slug })
    dbHelper.getChapterList_Helper(chapterList, req, res, next, null)
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
