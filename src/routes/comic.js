const express = require('express');
const router = express.Router();


const ComicController = require('../app/controllers/ComicController');

// comic / comment 
router.post('/comment', ComicController.postComment);
// comic / reply
router.post('/reply', ComicController.postReply);
// comic / comment / destroyComment
router.delete('/comment/destroyComment', ComicController.destroyComment);
// comic / comment / destroyReply
router.delete('/comment/destroyReply', ComicController.destroyReply);



module.exports = router;
