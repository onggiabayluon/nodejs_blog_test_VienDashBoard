const Comic     = require('../models/Comic');
const Chapter   = require('../models/Chapter');
const Comment   = require('../models/Comment');
const ObjectID  = require('mongodb').ObjectID;
const customError = require('../../util/customErrorHandler')
const { singleMongooseToObject, multiMongooseToObject } = require('../../util/mongoose');

class ComicController {

  comicdetailsPage(req, res, next) {
    Promise.all([
      Comic.findOne({ slug: req.params.comicSlug }).lean().populate('category', 'name'),
      Comment.findOne({ comicSlug: req.params.comicSlug, chapter: null }).lean(),
      Comment.aggregate([
        {
          $match:  { comicSlug: req.params.comicSlug, chapter: null }
        },
        {
          $unwind: "$commentArr"
        },
        {
          $project: {
          _id: 0,
          length: {  $size: "$commentArr.reply" }}
        }
      ])
    ])
      .then(([comicdoc, commentdoc, repliesArr]) => {
        if (!comicdoc) {
          return next(new customError('Not found', 404));
        }
        var commentLength = (commentdoc) ? commentdoc.commentArr.length : 0
        res.status(200).render('comic.details.hbs', {
          layout: 'home_layout',
          comic: comicdoc,
          comments: commentdoc,
          commentLength: commentLength,
          repliesArr: repliesArr
        })
      })
      .catch(next)
  };

  chapterdetailsPage(req, res, next) {
    var comicSlug = req.params.comicSlug
    var currentReadingChapter = req.params.chapter
    var cookie = req.cookies[comicSlug]; //  ['chapter-1', 'chapter-2]}

    Promise.all([
      Comic.findOne({ slug: comicSlug }).lean(),
      Chapter.findOne({ comicSlug: comicSlug, chapter: req.params.chapter }).lean(),
      Comment.findOne({ comicSlug: comicSlug, chapter: req.params.chapter }).lean()
    ])
      .then(([comicdoc, chapterdoc, commentdoc]) => {
        if (!chapterdoc || !comicdoc) {
          return next(new customError('Not found', 404));
        }

        checkCookie(comicdoc)

        renderChapterView(comicdoc, chapterdoc, commentdoc)
      })
      .catch(err => next(err))


    async function checkCookie(comic) {

      var hadCookie = (cookie === undefined) ? false : true

      if (hadCookie === false) {

        // Set Cookie
        res.cookie(comicSlug, { chapters: [currentReadingChapter] }, { maxAge: 604800000 })

        // Increase View
        icreaseView(comic)

      }
      if (hadCookie === true) {

        var checkisViewed = await isViewed(cookie)

        if (!checkisViewed) {
          /* check 0 mean not view yet so change oldCookie to new 
          and increase view */

          // Set new Cookie

          var currentComicList = cookie

          var newComicList = { chapters: appendObjTo(currentComicList, 'chapters', currentReadingChapter) }

          res.cookie(comicSlug, newComicList, { maxAge: 604800000 })

          // increase view
          icreaseView(comic)

        } // check 1 mean already count so do nothing
      }
    };

    function icreaseView(comic) {
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      var yyyy = String(today.getFullYear());

      if (comic.view.dayView.thisDay == dd) { comic.view.dayView.view++ } else {
        comic.view.dayView.view = 1
        comic.view.dayView.thisDay = dd
      }
      if (comic.view.monthView.thisMonth == mm) { comic.view.monthView.view++ } else {
        comic.view.monthView.view = 1
        comic.view.monthView.thisMonth = mm
      }
      if (comic.view.yearView.thisYear == yyyy) { comic.view.yearView.view++ } else {
        comic.view.yearView.view = 1
        comic.view.yearView.thisYear = yyyy
      }

      comic.view.totalView++

      const comicView = {
        'view.totalView': comic.view.totalView,
        'view.dayView.view': comic.view.dayView.view,
        'view.dayView.thisDay': comic.view.dayView.thisDay,
        'view.monthView.view': comic.view.monthView.view,
        'view.monthView.thisMonth': comic.view.monthView.thisMonth,
        'view.yearView.view': comic.view.yearView.view,
        'view.yearView.thisYear': comic.view.yearView.thisYear,
      }
      Comic.updateOne(
        { slug: comicSlug },
        { $set: comicView },
      ).exec()

      // comic.save()
    };

    function appendObjTo(thatArray, thatArrayProperty, newObj) {
      const frozenObj = Object.freeze(newObj);
      return Object.freeze(thatArray[thatArrayProperty].concat(frozenObj));
    };

    function isViewed(viewedComicList) {
      var result = []
      for (let i = 0; i < viewedComicList.chapters.length; i++) {
        if (viewedComicList.chapters[i] === currentReadingChapter) {
          result = viewedComicList.chapters[i]
          break;
        }
      }
      return (result === currentReadingChapter) // if check cookie giống chapter đang đọc > true
    };

    function renderChapterView(comicdoc, chapterDoc, commentDoc) {
      const commentArr = (commentDoc != null) ? commentDoc.commentArr : []
      res.render('me/showChapter.hbs',
        {
          layout: 'home_layout',
          comics: comicdoc,
          chapter: chapterDoc,
          commentArr: commentArr,
          user: singleMongooseToObject(req.user),
        })
    };
  };

  postComment(req, res, next) {
    // if (!req.body.user_id ) return res.redirect('back')
    const chapter = (req.body.isComicComment == "true") ? null : req.body.chapter
    
    //check nếu truyện đã có 
    Comment.findOne({comicSlug: req.body.comicSlug, chapter: chapter}).lean()
    .then(commentDoc => {
       console.log(commentDoc) // :x:
      if (!commentDoc) { 
        // Trường hợp Chưa có comment của truyện này => tạo mới

        return createNewComicComment()

      } else {
        // Trường hợp đã có comment của truyện này => push vô thêm

        return pushNewComment()

      }
    })
    .catch(err => next(err))

    function createNewComicComment() {
      //không trùng truyện => tạo mới
      const comment = new Comment();
      const newComicComment = {
          user_id: req.body.user_id,
          userName: req.body.user_id,
          text: req.body.text,
          updatedAt: req.body.updatedAt,
          reply: []
      }
      
      comment.title = req.body.title
      comment.comicSlug = req.body.comicSlug
      comment.chapter = chapter
      comment.commentArr.push(newComicComment)
      comment.save()
    };

    
    function pushNewComment() {
      const newComment = {
        _id: new ObjectID(),
        user_id: req.body.user_id,
        userName: req.body.userName,
        text: req.body.text,
        updatedAt: req.body.updatedAt,
        reply: []
      }

      Comment.findOneAndUpdate(
        { comicSlug: req.body.comicSlug, "chapter": chapter},
        { $push: { [`commentArr`]: {$each: [newComment], $position: 0} } },
        {safe: true, upsert: true})
        .exec()
      
      sendStufftoClient(newComment);
    };


    function sendStufftoClient(newComment) {
      res.status(200).render('template/comment.template.hbs', {
        layout: 'fetch_layout',
        comments: newComment
      })
    };
  };
  
  destroyComment(req, res, next) {
    // if (!req.body.user_id ) return res.redirect('back')
    const chapter = (req.body.isComicComment == "true") ? null : req.body.chapter
    Comment.findOne({ comicSlug: req.body.comicSlug, chapter: chapter }).lean()
      .then(commentDoc => {
        if(!commentDoc) { return next(new customError('Comment Not found', 404)); }
        return pullComment()
      })
      .catch(err => next(err))

    function pullComment() {
      Comment.updateOne(
        { comicSlug: req.body.comicSlug, chapter: chapter },
        { $pull: { [`commentArr`]: { _id: req.body.comment_id } } },
      ).exec().catch(next)

      sendStufftoClient()
    };
    function sendStufftoClient() {
      res.send({
        text: 'delete succesfully'
      })
    };
  };

  postReply(req, res, next) {
    // if (!req.body.user_id ) return res.redirect('back')
    const chapter = (req.body.isComicComment == "true") ? null : req.body.chapter
    Comment.findOne({ comicSlug: req.body.comicSlug, chapter: chapter }).lean()
      .then(commentDoc => {

        return pushNewReply(commentDoc)
        
      })
      .catch(err => next(err))

      function pushNewReply(commentDoc) {
        const newReply = {
          _id: new ObjectID(),
          userName: req.body.userName,
          user_id: req.body.user_id,
          text: req.body.text,
          updatedAt: req.body.updatedAt,
        }

        const commentIndex = commentDoc.commentArr.findIndex(x => JSON.stringify(x._id) === JSON.stringify(req.body.comment_id))
        
        Comment.updateOne(
          { comicSlug: req.body.comicSlug, "chapter": chapter },
          { $push: { [`commentArr.${commentIndex}.reply`]: newReply } },
          { safe : true, upsert: true }).exec()

        sendStufftoClient(newReply, req.body.comment_id);
      };
      function sendStufftoClient(newReply, comment_id) {
        res.status(200).render('template/reply.template.hbs', {
          layout: 'fetch_layout',
          reply: newReply,
          comment_id: comment_id
        })
      };
  };

  destroyReply(req, res, next) {
    // if (!req.body.user_id ) return res.redirect('back')
    const chapter = (req.body.isComicComment == "true") ? null : req.body.chapter
    Comment.findOne({ comicSlug: req.body.comicSlug, chapter: chapter }).lean()
      .then(commentDoc => {

        return pullReply(commentDoc)

      })
      .catch(err => next(err))

    function pullReply(commentDoc) {
      const commentIndex = commentDoc.commentArr.findIndex(x => JSON.stringify(x._id) === JSON.stringify(req.body.comment_id))
     
      Comment.updateOne(
        { comicSlug: req.body.comicSlug, chapter: chapter },
        { $pull: { [`commentArr.${commentIndex}.reply`]: { _id: req.body.reply_id } } },
      ).exec()

      sendStufftoClient()
    };

    function sendStufftoClient() {
      res.send({
        text: 'delete succesfully'
      })
    };
  };

}

//export (SiteController) thì lát require nhận được nó
module.exports = new ComicController();
