const Comic     = require('../models/Comic');
const Comment   = require('../models/Comment');
const mongoose  = require('mongoose');
const { singleMongooseToObject, multiMongooseToObject } = require('../../util/mongoose');

class ComicController {

  postComment(req, res, next) {
    var condition = req.body.chapter

    //check nếu truyện đã có 
    Comment.findOne({comicSlug: req.body.comicSlug})
    .then(commentDoc => {
      if(!commentDoc) { return createNewComicComment() }
      console.log(commentDoc.chapterArr)
      var filteredChapterArr = filterChapter(commentDoc.chapterArr, condition)
      console.log("filteredChapterArr: ")
      console.log(filteredChapterArr)
      if(filteredChapterArr.length == 0) {
        //Chưa có chapter đó nên push chapter mới vào
        pushNewChapter2()

        // mongoose.set('debug', true)
        // pushNewChapter(commentDoc)
        // commentDoc.save()
      }
      if(filteredChapterArr.length > 0) {
        //Đã có chapter đó nên push comment mới vào
        pushNewComment2()

        
        // mongoose.set('debug', true)
        // pushNewComment(filteredChapterArr)
        // commentDoc.save()
      }
      // console.log(filteredChapterArr)
    })

    function pushNewComment2() {
      const newComment = {
        userId: req.body.userId,
        text: req.body.inputText,
        reply: []
      }
      Comment.findOneAndUpdate(
        { comicSlug: req.body.comicSlug, "chapterArr.chapter": req.body.chapter },
        { $push: { 'chapterArr.0.commentArr': {$each: [newComment], $position: 0} } },
        {safe: true, upsert: true}).exec()
    };

    function pushNewChapter2(commentDoc) {
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
    
    function pushNewComment(filteredChapterArr) {
      const newComment = {
        userId: req.body.userId,
        text: req.body.inputText
      }
      filteredChapterArr.forEach(filteredChapter => {
        filteredChapter.commentArr.unshift(newComment)
        console.log("filteredChapter.commentArr: ")
        console.log(filteredChapter.commentArr)
      })
    };

    function pushNewChapter(commentDoc) {
      const chapter = {
        chapter: req.body.chapter,
        commentArr: {
          userId: req.body.userId,
          text: req.body.inputText
        }
      }
      commentDoc.chapterArr.push(chapter)
      console.log("chapterArr after push: ")
      console.log(commentDoc.chapterArr)
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

  };
  
}

//export (SiteController) thì lát require nhận được nó
module.exports = new ComicController();
