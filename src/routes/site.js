const express = require('express');
const router = express.Router();
// Load Middleware
const { authRole, ensureAuthenticated, forwardAuthenticated } = require('../config/auth/auth');
// Load User model
const { User } = require('../app/models/User');
// Load Sitecontroller
const Sitecontroller = require('../app/controllers/SiteController');

router.get('/dashboard', ensureAuthenticated, Sitecontroller.dashboardPage);
router.post('/search', Sitecontroller.search);

//HOME
router.get('/', Sitecontroller.index);

module.exports = router;
