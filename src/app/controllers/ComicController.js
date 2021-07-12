const Comic     = require('../models/Comic');
const Chapter   = require('../models/Chapter');
const Comment   = require('../models/Comment');
const ObjectID  = require('mongodb').ObjectID;
const customError = require('../../util/customErrorHandler')
const { singleMongooseToObject, multiMongooseToObject } = require('../../util/mongoose');

class ComicController {

  comicdetailsPage(req, res, next) {
    let sort = (req.query.hasOwnProperty('_sort')) ? {[req.query.column]: parseInt(req.query.type)} : {commentArr: -1} 

    let page = +req.body.page || 1;
    let PageSize = 10;
    let skipComment = (page - 1) * PageSize;

    Promise.all([
      Comic.findOne({ slug: req.params.comicSlug }).lean()
      .populate('category', 'name')
      .populate({ path: 'chapters', select: '-_id chapter updatedAt', options: { sort: { 'chapter': 1 } }}),
      Comment.aggregate([
        { $match: { comicSlug: req.params.comicSlug, chapter: null } },
        { $limit: 1 },
        {
          $addFields: {
            maxComment: { $size: "$commentArr" }
          }
        },
        { $unwind: "$commentArr" },
        { $sort: sort },
        { $skip: skipComment },
        { $limit: PageSize },
        {
          $addFields: {
            replyLength : { $size: "$commentArr.reply" },
          }
        },
        {
          $group: {
          _id: '$_id',
          title:      { $first: '$title'      }, 
          chapter:    { $first: '$chapter'    }, 
          comicSlug:  { $first: '$comicSlug'  }, 
          maxComment: { $first: '$maxComment' }, 
          commentArr: { $push: '$commentArr'  },
          replyLength: { $push: '$replyLength'  },}
        },
      ])
    ])
      .then(([comicdoc, commentdoc]) => {
        if (!comicdoc) {
          return next(new customError('Not found', 404));
        }
        let chaptersLength = comicdoc.chapters.length
        res.status(200).render('comic.details.hbs', {
          layout: 'home_layout',
          comic: comicdoc,
          comments: commentdoc,
          firstChapter: comicdoc.chapters[0],
          lastChapter: comicdoc.chapters[chaptersLength - 1],
          user: singleMongooseToObject(req.user),
        })
      })
      .catch(next)
  };

  chapterdetailsPage(req, res, next) {
    let sort = (req.query.hasOwnProperty('_sort')) ? {[req.query.column]: parseInt(req.query.type)} : {commentArr: -1} 
    let match = (req.query.hasOwnProperty('_match')) ? { comicSlug: req.params.comicSlug, chapter: { $ne: null } } : { comicSlug: req.params.comicSlug, chapter: req.params.chapter }
    
    var comicSlug = req.params.comicSlug
    var currentReadingChapter = req.params.chapter
    var cookie = req.cookies[comicSlug]; //  ['chapter-1', 'chapter-2]}

    let page = +req.body.page || 1;
    let PageSize = 10;
    let firstLimit = (req.query.hasOwnProperty('_match')) ? PageSize : 1
    let skipComment = (page - 1) * PageSize;
    
    Promise.all([
      Comic.findOne({ slug: comicSlug }).lean()
      .select('-category').populate('chapters', 'chapter')
      .populate({ path: 'chapters', select: '-_id chapter', options: { sort: { 'chapter': 1 } }}),
      Chapter.findOne({ comicSlug: comicSlug, chapter: req.params.chapter }).lean(),
      Comment.aggregate([
        { $match: match },
        { $limit: firstLimit },
        {
          $addFields: {
            maxComment: { $size: "$commentArr" }
          }
        },
        { $unwind: "$commentArr" },
        { $sort: sort },
        { $skip: skipComment },
        { $limit: PageSize },
        {
          $addFields: {
            replyLength : { $size: "$commentArr.reply" },
          }
        },
        {
          $group: {
          _id: '$_id',
          title:      { $first: '$title'      }, 
          chapter:    { $first: '$chapter'    }, 
          comicSlug:  { $first: '$comicSlug'  }, 
          maxComment: { $first: '$maxComment' }, 
          commentArr: { $push: '$commentArr'  },
          replyLength: { $push: '$replyLength'  },}
        },
        { $sort: sort },
      ])
    ])
      .then(([comicdoc, chapterdoc, commentdoc]) => {
        if (!chapterdoc || !comicdoc) {
          return next(new customError('Not found', 404));
        }

        renderChapterView(comicdoc, chapterdoc, commentdoc)
        checkCookie(comicdoc)
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

    function renderChapterView(comicdoc, chapterdoc, commentdoc) {
      
      //sort to make sure when chapters get deleted then this btn wont callapse
      comicdoc.chapters.sort(function(a,b) {return (a.chapter > b.chapter) ? 1 : ((b.chapter > a.chapter) ? -1 : 0);} );

      let $thisChapterIndex = comicdoc.chapters.findIndex(x => JSON.stringify(x.chapter) === JSON.stringify(chapterdoc.chapter))
      
      let prevChapter = comicdoc.chapters[$thisChapterIndex - 1]
      let nextChapter = comicdoc.chapters[$thisChapterIndex + 1]
      
      res.render('chapter.details.hbs',
        {
          layout: 'chapter.details.layout.hbs',
          comics: comicdoc,
          chapter: chapterdoc,
          comments: commentdoc,
          prevChapter: prevChapter,
          nextChapter: nextChapter,
          user: singleMongooseToObject(req.user),
        })
    };
  };

  postComment(req, res, next) {
    // if (!req.body.user_id ) return res.redirect('back')
    const chapter = (req.body.isChapterComment == "true" || req.body.isChapterReply == "true") ? req.body.chapter : null
    
    //check nếu truyện đã có 
    Comment.findOne({comicSlug: req.body.comicSlug, chapter: chapter}).lean()
    .then(commentDoc => {
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
      sendStufftoClient(newComicComment);
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
    const chapter = (req.body.isChapterComment == "true" || req.body.isChapterReply == "true") ? req.body.chapter : null
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
    const chapter = (req.body.isChapterComment == "true" || req.body.isChapterReply == "true") ? req.body.chapter : null
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
    const chapter = (req.body.isChapterComment == "true" || req.body.isChapterReply == "true") ? req.body.chapter : null
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

  editComment(req, res, next) {
    // if (!req.body.user_id ) return res.redirect('back')
    // chapter = null => edit comic
    // chapter = number => edit chapter
    const chapter = (req.body.isChapterComment == "true" || req.body.isChapterReply == "true") ? req.body.chapter : null
    
    Comment.findOne({ comicSlug: req.body.comicSlug, chapter: chapter }).lean().select('commentArr')
      .then(commentDoc => {

        if (req.body.isComicComment == 'true' || req.body.isChapterComment == 'true')
        return updateComment(commentDoc)
        
        if (req.body.isComicReply == 'true' || req.body.isChapterReply == 'true')
        return updateReply(commentDoc)
    
      })
      .catch(err => next(err))


    function updateComment(commentDoc) {

      const commentIndex = commentDoc.commentArr.findIndex(x => JSON.stringify(x._id) === JSON.stringify(req.body.comment_id))
      
      Comment.updateOne(
        { comicSlug: req.body.comicSlug, chapter: chapter},
        { $set: { [`commentArr.${commentIndex}.text`]: req.body.text } })
        .then(() => {
          res.send({comment_id: req.body.comment_id})
        })
        .catch(next)
    };

    function updateReply(commentDoc) {

      const commentIndex = commentDoc.commentArr.findIndex(x => JSON.stringify(x._id) === JSON.stringify(req.body.comment_id))
      const replyIndex = commentDoc.commentArr[commentIndex].reply.findIndex(x => JSON.stringify(x._id) === JSON.stringify(req.body.reply_id))

      Comment.updateOne(
        { comicSlug: req.body.comicSlug, chapter: chapter},
        { $set: { [`commentArr.${commentIndex}.reply.${replyIndex}.text`]: req.body.text } })
        .then(() => {
          res.send({
            comment_id: req.body.comment_id,
            reply_id: req.body.reply_id,
          })
        })
        .catch(next)
    };

  }

  fetchMoreComments(req, res, next) {
    let chapter = (req.body.isChapterComment == "true" || req.body.isChapterReply == "true") ? req.body.chapter : null
    let sort = (req.query.hasOwnProperty('_sort')) ? {[req.query.column]: parseInt(req.query.type)} : {commentArr: -1} 
    let match = (req.query.hasOwnProperty('_match')) ? {} : { comicSlug: req.body.comicSlug, chapter: chapter }
    let firstLimit = (req.query.hasOwnProperty('_match')) ? PageSize : 1

    let page = +req.body.page || 1;
    let PageSize = 10;
    let skipComment = (page - 1) * PageSize;
    Comment.aggregate([
      { $match: match },
      { $limit: firstLimit },
      { $unwind: "$commentArr" },
      { $sort: sort },
      { $skip: skipComment },
      { $limit: PageSize },
      {
        $addFields: {
          replyLength : { $size: "$commentArr.reply" }
        }
      },
      {
        $group: {
        _id: '$_id',
        title:      { $first: '$title'      }, 
        chapter :   { $first: '$chapter'    }, 
        comicSlug : { $first: '$comicSlug'  }, 
        commentArr: { $push: '$commentArr'  },
        replyLength: { $push: '$replyLength'  },}
      },
      { $sort: sort },
    ])
    .then(commentdoc => {
      if(!commentdoc) { res.send(false) }
      res.status(200).render('template/fetch.comments.template.hbs', {
        layout: 'fetch_layout',
        comments: commentdoc[0]
      })
    })
    .catch(next)
  };

}

//export (SiteController) thì lát require nhận được nó
module.exports = new ComicController();
