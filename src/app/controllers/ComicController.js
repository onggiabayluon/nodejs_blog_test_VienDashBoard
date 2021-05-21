const Comic     = require('../models/Comic');
const Comment   = require('../models/Comment');
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
        pushNewChapter(commentDoc)
        commentDoc.save()
      }
      if(filteredChapterArr.length > 0) {
        //Đã có chapter đó nên push comment mới vào
        pushNewComment(filteredChapterArr)
        commentDoc.save()
      }
      // console.log(filteredChapterArr)
    })

    function pushNewComment(filteredChapterArr) {
      const newComment = {
        userId: req.body.userId,
        text: req.body.inputText
      }
      filteredChapterArr.forEach(filteredChapter => {
        filteredChapter.comment.unshift(newComment)
        console.log("filteredChapter.comment: ")
        console.log(filteredChapter.comment)
      })
    };

    function pushNewChapter(commentDoc) {
      const chapter = {
        chapter: req.body.chapter,
        comment: {
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
        comment: {
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
