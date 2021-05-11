const express = require('express');
const router = express.Router();
// Load Middleware
const { authRole, ensureAuthenticated, forwardAuthenticated } = require('../config/auth/auth');
// Load Fetchcontroller
const Fetchcontroller = require('../app/controllers/Fetchcontroller');

// Route: fetch / comics / :chapterSlug
router.get('/comics/:chapterSlug', Fetchcontroller.fetchChapters);
// Route: fetch / comics
router.get('/comics', Fetchcontroller.fetchComics);
// Route: fetch / users
router.get('/users', Fetchcontroller.fetchUsers);

module.exports = router;
