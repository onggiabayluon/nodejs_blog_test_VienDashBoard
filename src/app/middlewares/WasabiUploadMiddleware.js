const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const util = require("util");
const Chapter = require('../models/Chapter');
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
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
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
    key: function (req, file, cb) {
        // console.log(file)
        
        var ImageFolder = req.params.slug + '/chapter-' + req.body.chapter + '/'
        //If you want to save into a folder concat de name of the folder to the path
        var fullPath =  `${ImageFolder}${Date.now()}-${file.originalname}`;
        cb(null, fullPath)
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
