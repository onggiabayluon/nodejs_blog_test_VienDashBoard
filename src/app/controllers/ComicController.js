const Comic     = require('../models/Comic');
const Comment   = require('../models/Comment');
const mongoose  = require('mongoose');
const ObjectID = require('mongodb').ObjectID;
const { singleMongooseToObject, multiMongooseToObject } = require('../../util/mongoose');

class ComicController {

  postComment(req, res, next) {
    const condition = req.body.chapter
    //check nếu truyện đã có 
    Comment.findOne({comicSlug: req.body.comicSlug}).lean()
    .then(commentDoc => {
      if(!commentDoc) { 
        createNewComicComment() 
      }
      const filteredChapterArr = filterChapter(commentDoc.chapterArr, condition)
      if(filteredChapterArr.length == 0) {
        // Trường hợp Chưa có chapter trong truyện đó nên push chapter mới vào
        return pushNewChapter()
        // return sendStufftoClient(commentDoc) 
      }
      if(filteredChapterArr.length > 0) {
        //Đã có chapter đó trong truyện nên push comment mới vào
        pushNewComment(commentDoc) //❌
        // return sendStufftoClient(commentDoc) 
      }
    })
    .catch(err => next(err))

    function pushNewComment(commentDoc) {
      const newComment = {
        _id: new ObjectID(),
        userId: req.body.userId,
        userName: req.body.userName,
        text: req.body.inputText,
        reply: []
      }
      const index = commentDoc.chapterArr.findIndex(x => x.chapter === req.body.chapter)
      Comment.findOneAndUpdate(
        { comicSlug: req.body.comicSlug, "chapterArr.chapter": req.body.chapter },
        { $push: { [`chapterArr.${index}.commentArr`]: {$each: [newComment], $position: 0} } },
        {safe: true, upsert: true})
        .exec()
      
      sendStufftoClient(newComment);
    };

    function pushNewChapter() {
      const newChapter = {
        chapter: req.body.chapter,
        commentArr: {
          userId: req.body.userId,
          text: req.body.inputText,
          reply: []
        }
      }
      Comment.findOneAndUpdate(
        { comicSlug: req.body.comicSlug },
        { $push: { 'chapterArr': newChapter } },
        {safe: true, upsert: true}).exec()
    };
    
    function createNewComicComment() {
      //không trùng truyện => tạo mới
      const comment = new Comment();
      const newComicComment = {
        chapter: req.body.chapter,
        commentArr: {
          userId: req.body.userId,
          text: req.body.inputText
        }
      }
      comment.comicSlug = req.body.comicSlug
      comment.chapterArr.push(newComicComment)
      comment.save()
    };

    function filterChapter(chapterArr, condition) {
      var result = []
      for (let i = 0; i < chapterArr.length; i++) {
        if (chapterArr[i].chapter == condition) {
          result = [chapterArr[i]]
          break;
        }
      }
      return result;
    };

    function sendStufftoClient(newComment) {
      res.send({
        comment_id: newComment._id 
      })
    };
  };
  
  destroyComment(req, res, next) {
    Comment.findOne({ comicSlug: req.body.comicSlug }).lean()
      .then(commentDoc => {
        if(!commentDoc) { return console.log('error') }
        return pullComment(commentDoc)
      })
      .catch(err => next(err))

    function pullComment(commentDoc) {
      const chapterIndex = commentDoc.chapterArr.findIndex(x => x.chapter === req.body.chapter)
      Comment.updateOne(
        { comicSlug: req.body.comicSlug },
        { $pull: { [`chapterArr.${chapterIndex}.commentArr`]: { _id: req.body.comment_id } } },
      ).exec()
      sendStufftoClient()
    };
    function sendStufftoClient() {
      res.send({
        text: 'delete succesfully'
      })
    };
  };

  postReply(req, res, next) {
    Comment.findOne({ comicSlug: req.body.comicSlug }).lean()
      .then(commentDoc => {
        if(!commentDoc) { return console.log('error') }
        return pushNewReply(commentDoc)
      })
      .catch(err => next(err))

      function pushNewReply(commentDoc) {
        const newReply = {
          _id: new ObjectID(),
          userName: req.body.userName,
          userId: req.body.userId,
          text: req.body.inputText
        }
        const chapterIndex = commentDoc.chapterArr.findIndex(x => x.chapter === req.body.chapter)
        const commentIndex = commentDoc.chapterArr[chapterIndex].commentArr.findIndex(x => JSON.stringify(x._id) === JSON.stringify(req.body.comment_id))
        Comment.updateOne(
          { comicSlug: req.body.comicSlug, "chapterArr.chapter": req.body.chapter },
          { $push: { [`chapterArr.${chapterIndex}.commentArr.${commentIndex}.reply`]: newReply } },
          {safe: true, upsert: true}).exec()

        sendStufftoClient(newReply);
      };
      function sendStufftoClient(newReply) {
        res.send({
          reply_id: newReply._id 
        })
      };
  };

  destroyReply(req, res, next) {
    Comment.findOne({ comicSlug: req.body.comicSlug }).lean()
      .then(commentDoc => {
        if(!commentDoc) { return console.log('error') }
        return pullReply(commentDoc)
      })
      .catch(err => next(err))

    function pullReply(commentDoc) {
      const chapterIndex = commentDoc.chapterArr.findIndex(x => x.chapter === req.body.chapter)
      const commentIndex = commentDoc.chapterArr[chapterIndex].commentArr.findIndex(x => JSON.stringify(x._id) === JSON.stringify(req.body.comment_id))
      Comment.updateOne(
        { comicSlug: req.body.comicSlug },
        { $pull: { [`chapterArr.${chapterIndex}.commentArr.${commentIndex}.reply`]: { _id: req.body.reply_id } } },
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
