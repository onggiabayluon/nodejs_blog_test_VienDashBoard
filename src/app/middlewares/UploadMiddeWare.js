const Chapter = require('../models/Chapter');
const multer = require("multer");
const path = require("path");
const util = require("util");

let multerStorage = multer.diskStorage({
    // Định nghĩa nơi file upload sẽ được lưu lại
    destination: (req, file, callback) => {

        callback(null, path.join(`${__dirname}/../../uploadResults`));

    },

    filename: (req, file, callback) => {
        let math = ["image/png", "image/jpeg"];
        if (math.indexOf(file.mimetype) === -1) {
    
          let errorMess = `The file <strong>${file.originalname}</strong> is invalid. Only allowed to upload image jpeg or png.`;
          return callback(errorMess, null);
          
        }
        let filename = `${Date.now()}-${file.originalname}`;

        callback(null, filename);
    }
});

function chapterIsExisted(req) {
    // 1. Implement this!
    console.log(req.body)
    return (
        Chapter
            .findOne({ comicSlug: req.params.slug, chapter: `chapter-${req.body.chapter}` })
            .then(chapterExisted => {
                console.log(chapterExisted)
                if (chapterExisted == null) { return false }
                return true
            }))
};

const filter = async (req, file, cb) => {
    var check = await chapterIsExisted(req)
    console.log(check)
    if (check == false) {
        cb(null, true)
    } else {
        let errorMess = `chapter ${req.body.chapter} đã có, hãy nhập chapter khác`;
        return cb(errorMess, false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: filter
}).array("many-files", 200);;


let multipleUploadMiddleware = util.promisify(upload);
 
 module.exports = multipleUploadMiddleware;