const express = require('express');
const router = express.Router();

const meController = require('../app/controllers/meController');
const UploadController  = require('../app/controllers/UploadController');
//đang ở trong route: /courses/:slug
//:slug là route kế tiếp /news/details

// router.get('/stored/manga/:slug', meController.storedAllChapter);
// router.get('/stored/manga', meController.storedTruyenTranhs);
router.get('/stored/comics', meController.storedComics);

router.post('/stored/comics/:slug/multiple-upload', UploadController.multipleUpload);
router.post('/stored/comics/:slug/single-upload', UploadController.singleUpload);
router.get('/stored/comics/:slug/edit', meController.renderComicEdit);
// [GET] / me / stored / comics / :slug -> update
router.put('/stored/comics/:slug', meController.update);
// [GET] / me / stored / comics / comic-list
router.get('/stored/comics/comic-list', meController.getComicList);
// [GET] / me / stored / comics / :slug / chapter-list
router.get('/stored/comics/:slug/chapter-list', meController.getChapterList);
// [GET] / me / stored / comics / :slug / create-chapter
router.get('/stored/comics/:slug/create-chapter', meController.renderCreateChapter);
// [GET] / me / stored / comics / create
router.get('/stored/comics/create', meController.renderCreate);
router.post('/stored/comics/create', meController.createComic);
//  [GET] / me / stored / destroyComic / :slug [Xóa]
router.delete('/stored/destroyComic/:slug', meController.destroyComic);
router.delete('/stored/destroyChapter/:slug', meController.destroyChapter);

router.post('/stored/handle-form-action-for-comics', meController.handleFormActionForComics);
router.post('/stored/handle-form-action-for-chapters', meController.handleFormActionForChapters);

// --terminated-- router.get('/trash/truyen-tranh/:slug', meController.trashChapters);
// --terminated-- router.get('/trash/truyen-tranh', meController.trashTruyenTranhs);



module.exports = router;