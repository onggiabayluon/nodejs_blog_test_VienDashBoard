const express = require('express');
const router = express.Router();

const Sitecontroller = require('../app/controllers/SiteController');

router.post('/search', Sitecontroller.search);

//HOME
router.get('/', Sitecontroller.index);

module.exports = router;
