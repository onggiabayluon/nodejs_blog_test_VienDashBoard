const express = require('express');
const router = express.Router();


const ComicController = require('../app/controllers/ComicController');

// comic / :slug / comment
router.post('/comment', ComicController.postComment);



module.exports = router;
