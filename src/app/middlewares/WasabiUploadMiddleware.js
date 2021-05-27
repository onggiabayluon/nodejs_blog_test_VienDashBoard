const { AutoScaling } = require('aws-sdk');
const AWS           = require('aws-sdk');
const multer        = require('multer');
const multerS3      = require('multer-s3-transform');
const util          = require("util");
const Chapter       = require('../models/Chapter');
const sharp         = require("sharp");
const wasabiEndpoint = new AWS.Endpoint(process.env.WASABI_ENDPOINT);

const s3 = new AWS.S3({
    endpoint: wasabiEndpoint,
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
    Bucket: process.env.WASABI_BUCKET_NAME,
    region: process.env.WASABI_REGION,
  });

function chapterIsExisted (req) {
    // 1. Implement this!
      return (
        Chapter
        .findOne({comicSlug: req.params.slug, chapter: `chapter-${req.body.chapter}`})
        .then(chapterExisted => {
          if (chapterExisted) { return false } 
          return true 
        }))
}

const fileFilter = async (req, file, cb) => {
    var check = await chapterIsExisted(req)
    // console.log(check)
    if (check == true) {
        cb(null, true)
    } else {
        let errorMess = `chapter ${req.body.chapter} đã có, hãy nhập chapter khác`;
        return cb(errorMess, null);
    }
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
        cb(null, true)
    } else {
        let errorMess = `The file <strong>${file.originalname}</strong> is invalid. Only allowed to upload image jpeg or png.`;
        return cb(errorMess, null);
    }
}

const multerS3Config = multerS3({
    s3: s3,
    bucket: process.env.WASABI_BUCKET_NAME,
    cacheControl: 'max-age=31536000',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    shouldTransform: function (req, file, cb) {
        // console.log('in should transform ', file)
        cb(null, /^image/i.test(file.mimetype))
    },
    transforms: [{
        id: 'lg',
        key: function (req, file, cb) {
            const filename = file.originalname.replace(/\..+$/, "");
            const newFilenameLarge = `${filename}-large.jpg`;

            var fullPath = `${req.params.slug}/chapter-${req.body.chapter}/${Date.now()}-${newFilenameLarge}`;
            cb(null, fullPath)
        },
        transform: function (req, file, cb) {
            cb(null, sharp().jpeg({ quality: 90 }).resize(1000))
        }
    }, {
        id: 'md',
        key: function (req, file, cb) {
            const filename = file.originalname.replace(/\..+$/, "");
            const newFilenameMedium = `${filename}-medium.webp`;

            var fullPath = `${req.params.slug}/chapter-${req.body.chapter}/${Date.now()}-${newFilenameMedium}`;
            cb(null, fullPath)
        },
        transform: function (req, file, cb) {
            
            console.log(file)
            cb(null, sharp().webp({ quality: 90 }).resize(690))
        }
    }, {
        id: 'sm',
        key: function (req, file, cb) {
            const filename = file.originalname.replace(/\..+$/, "");
            const newFilenameSmall = `${filename}-small.webp`;

            var fullPath = `${req.params.slug}/chapter-${req.body.chapter}/${Date.now()}-${newFilenameSmall}`;
            cb(null, fullPath)
        },
        transform: function (req, file, cb) {
            cb(null, sharp().webp({ quality: 90 }).resize(400))
        }
    }],
    key: function (req, file, cb) {
        cb(null, true)
    }
});

 const uploadManyFiles = multer({
    storage: multerS3Config,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // we are allowing only 5 MB files
    }
}).array("many-files", 200);

 // Mục đích của util.promisify() là để bên controller có thể dùng async-await để gọi tới middleware này
 let multipleUploadMiddleware = util.promisify(uploadManyFiles);
 
 module.exports = multipleUploadMiddleware;
