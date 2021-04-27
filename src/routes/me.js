const express               = require('express');
const router                = express.Router();
//Load Controller
const meController          = require('../app/controllers/meController');
const S3UploadController    = require('../app/controllers/S3UploadController');
// Load Middleware
const { authRole, ensureAuthenticated, forwardAuthenticated } = require('../config/auth/auth');

// Admin Dashboard
router.get('/stored/comics/dashboard/admin', meController.adminDashboard);
// router.get('/stored/comics/dashboard/admin', ensureAuthenticated, authRole('admin') , meController.adminDashboard);
// Extra_Admin Dashboard
router.get('/stored/comics/dashboard/extraAdmin', meController.extraAdminDashboard);
// Quyền truy cập Page
router.get('/stored/comics/faqPage', meController.faqPage);
// Upload Chapter Images 
router.post('/stored/comics/:slug/S3-multiple-upload', S3UploadController.multipleUpload);
// Upload Thumbnail Image 
router.post('/stored/comics/:slug/S3-thumbnail-upload', S3UploadController.thumbnailUpload);

/**               ***
***  COMIC ROUTE  ***
***               **/

// Page Comic Edit 
router.get('/stored/comics/:slug/edit', ensureAuthenticated, meController.comicEditPage);
// User Page Comic List 
router.get('/stored/comics/comic-list/:comicId', ensureAuthenticated, meController.comicListPage);
// Admin Page Comic List 
router.get('/stored/comics/comic-list', ensureAuthenticated, authRole('admin'), meController.comicListPage);
// Page Create Comic
router.get('/stored/comics/create', ensureAuthenticated, meController.createComicPage);
// Create Comic
router.post('/stored/comics/create', ensureAuthenticated, meController.createComic);
// Update Comic
router.put('/stored/comics/:slug', ensureAuthenticated, meController.updateComic);
// Destroy Comic
router.delete('/stored/destroyComic/:slug', ensureAuthenticated, meController.destroyComic)
// Handling Comics Form 
router.post('/stored/handle-form-action-for-comics', ensureAuthenticated, meController.handleFormActionForComics);

/**               ***
*** CHAPTER ROUTE ***
***               **/

// show Chapter
router.get('/stored/comics/:slug/chapter-list/:chapter', meController.showChapter);
// Page Chapter List 
router.get('/stored/comics/:slug/chapter-list', meController.chapterListPage);
// Page Create Chapter
router.get('/stored/comics/:slug/create-chapter', meController.createChapterPage);;
// Destroy Chapter
router.delete('/stored/destroyChapter/:slug', meController.destroyChapter);
// Handling Chapters Form
router.post('/stored/handle-form-action-for-chapters', meController.handleFormActionForChapters);




module.exports = router;