// Variables
const Comic         = require('../models/Comic');
const Chapter       = require('../models/Chapter');
const shortid       = require('shortid');
// Upload Middleware
const MulterUploadMiddleware = require("../middlewares/MulterUploadMiddleWare");
const S3UploadMiddleWare = require("../middlewares/UploadMiddleWare")

class S3UploadController {

    // [POST] / stored /comics /:slug /S3-multiple-upload
    
    multipleUpload = async (req, res, next) => {
        await MulterUploadMiddleware(req, res)
        // .then(() => { saveURLToDb() })
        // .catch(err => next(err))
        var params = {
            slug: req.params.slug,
            chapter: `chapter-${req.body.chapter}`
        }
        var imagesURL = await S3UploadMiddleWare.uploadMultiple(req.files, params)
        saveURLToDb(imagesURL)

        function saveURLToDb(imagesURL) {
            console.log(imagesURL)
            const newChapter = new Chapter({
                title: `chapter of ${req.params.slug}`,
                chapter: `chapter-${req.body.chapter}`,
                chapterSlug: `${req.params.slug}-${shortid()}`,
                comicSlug: req.params.slug,
            })
            imagesURL.forEach((url, index) => {
                newChapter.image[index] = url
            });
            newChapter
            .save()
            .then(res.redirect('back'))
        };
           
    };

}

module.exports = new S3UploadController();
