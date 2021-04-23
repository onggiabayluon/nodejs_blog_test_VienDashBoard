const express = require('express');
const router = express.Router();


const MangaController = require('../app/controllers/MangaController');

//đang ở trong route: /manga/:slug
//:slug là route kế tiếp /news/details

router.get('/create', MangaController.renderCreate);
//them
router.post('/createTruyen', MangaController.createTruyen);
//
router.post('/handle-form-action', MangaController.handleFormAction);

router.get('/:slug/uploadChapter', MangaController.uploadChapter);
//upload ảnh
router.get('/upload', MangaController.renderUpload);
//[PUT]: chỉnh sửa lên chính cái id 
router.get('/:slug/edit', MangaController.edit);
router.put('/:slug', MangaController.update);
//sửa_restore
router.patch('/:slug/restore', MangaController.restore);
//xoa
router.delete('/force/:slug', MangaController.forceDestroy);
router.delete('/:slug', MangaController.destroy);

//
router.get('/:slug', MangaController.showMangaDetails);
router.get('/:slug/:chapter', MangaController.showChapterDetails);
//router.get('/:slug', MangaController.showSingleChapter);


module.exports = router;
