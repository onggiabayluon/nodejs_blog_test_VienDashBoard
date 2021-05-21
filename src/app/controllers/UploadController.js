const Comic         = require('../models/Comic');
const Chapter       = require('../models/Chapter');
const sharp         = require("sharp");
const path          = require('path');
const fs            = require('fs')

const MulterUploadMiddleware = require("../middlewares/UploadMiddeWare");

class S3UploadController {

    // [POST] / stored /comics /:slug /S3-multiple-upload
    
    multipleUpload = async (req, res, next) => {
            await MulterUploadMiddleware(req, res)
            .then(() => resizeImages(req, res, next))
            .then(()=> res.end("UPLOAD COMPLETED!"))
            .catch(err => next(err))

            async function resizeImages (req, res, next) {
                if (!req.files) return next();
                await Promise.all(
                    req.files.map(async file => {
                        const filename = file.filename.replace(/\..+$/, "");
                        const newFilenameLarge = `${filename}-large.jpg`;
                        const newFilenameMedium = `${filename}-medium.webp`;
                        const newFilenameSmall = `${filename}-small.webp`;

                        await fs.readFile(file.path, (err, data) => { 
                            if (err) { return next(err) }
                                sharp(data)
                                .resize({
                                    fit: sharp.fit.cover,
                                    width: 1000
                                })
                                .jpeg({ quality: 90 })
                                .toFile(`${file.destination}/${newFilenameLarge}`, () => {  })
                                .resize({
                                    fit: sharp.fit.cover,
                                    width: 690
                                })
                                .webp({ quality: 90 })
                                .toFile(`${file.destination}/${newFilenameMedium}`, () => {  })
                                .resize({
                                    fit: sharp.fit.cover,
                                    width: 400
                                })
                                .webp({ quality: 90 })
                                .toFile(`${file.destination}/${newFilenameSmall}`, () => { fs.unlinkSync(file.path) })
                            })
                            
                    })
                );
            };

            
    };

}

module.exports = new S3UploadController();
