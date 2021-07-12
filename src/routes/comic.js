const express = require('express');
const router = express.Router();


const ComicController = require('../app/controllers/ComicController');


// comic / :comicSlug 
router.get('/:comicSlug', ComicController.comicdetailsPage);
// comic /  :comicSlug / :chapterSlug 
router.get('/:comicSlug/:chapter', ComicController.chapterdetailsPage);

// comic /  comment / fetch
router.post('/comment/fetch', ComicController.fetchMoreComments);


// comic / comment 
router.post('/comment', ComicController.postComment);
// comic / reply
router.post('/reply', ComicController.postReply);
// comic / comment / destroyComment
router.delete('/comment/destroyComment', ComicController.destroyComment);
// comic / comment / destroyReply
router.delete('/comment/destroyReply', ComicController.destroyReply);
// comic / comment / edit
router.put('/comment/edit', ComicController.editComment);



module.exports = router;
