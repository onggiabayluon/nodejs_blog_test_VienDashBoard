const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const util = require("util");
const path = require("path");

const s3Config = new AWS.S3({
    accessKeyId: process.env.AWS_IAM_USER_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_IAM_USER_SECRET_ACCESS_KEY,
    Bucket: process.env.AWS_BUCKET_NAME,
    region: 'us-east-1'
  });

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true)
    } else {
        let errorMess = `The file <strong>${file.originalname}</strong> is invalid. Only allowed to upload image jpeg or png.`;
        return cb(errorMess, null);
    }
}

const multerS3Config = multerS3({
    s3: s3Config,
    bucket: process.env.AWS_BUCKET_NAME,
    cacheControl: 'max-age=31536000',
    acl: 'private',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    //acl: 'private',
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        console.log(file)
        
        var ImageFolder = req.params.slug + '/thumbnail/' 
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
}).single('single-file');

 // Mục đích của util.promisify() là để bên controller có thể dùng async-await để gọi tới middleware này
 let thumbnailUploadMiddleware = util.promisify(uploadManyFiles);
 
 module.exports = thumbnailUploadMiddleware;

/*
app.post('/upload', upload.array("many-files", 200), function (req, res, next) {
    res.send("Uploaded!");
});
*/