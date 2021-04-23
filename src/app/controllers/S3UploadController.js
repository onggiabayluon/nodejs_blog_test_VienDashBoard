const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const shortid = require('shortid');
const S3UploadMiddleWare = require("../middlewares/S3UploadMiddleWare");
const S3ThumbnailUploadMiddleware = require("../middlewares/S3ThumbnailUploadMiddleware");
const S3DeleteMiddleWare = require('../middlewares/S3DeleteMiddleware')

let debug = console.log.bind(console);
class S3UploadController {

    /**
 * Created by trungquandev.com's author on 17/08/2019.
 * multipleUploadController.js
 */
    // [POST] / stored /comics /:slug /S3-multiple-upload
    multipleUpload = async (req, res) => {
        try {
            // thực hiện upload
            // console.log(req.files)
            // return console.log(req.files)
            await S3UploadMiddleWare(req, res);

            // Nếu upload thành công, không lỗi thì tất cả các file của bạn sẽ được lưu trong biến req.files
            debug(req.files);

            // Mình kiểm tra thêm một bước nữa, nếu như không có file nào được gửi lên thì trả về thông báo cho client
            //parseFloat thì chữ abc sẽ mất, còn số giữ lại
            var chapter = parseFloat(req.body.chapter);
            if (req.files.length <= 0) {
                return res.send(`You must select at least 1 file or more.`);
            } else if (!chapter)
                return res.send(`bạn chưa điền vào cột chapter hoặc bạn nhập không phải số`);
            // trả về cho người dùng cái thông báo đơn giản.
            const imageArray = req.files;
            const comicChapter = new Chapter(req.body);

            function saveURLToDb() {
                return new Promise(resolve => {
                    comicChapter.chapter = 'chapter-' + req.body.chapter
                    comicChapter.title = 'chapter of ' + req.params.slug
                    comicChapter.chapterSlug = req.params.slug + '-' + shortid();
                    comicChapter.comicSlug = req.params.slug

                    console.log('title: ' + comicChapter.title);
                    console.log('comicSlug: ' + comicChapter.comicSlug);
                    console.log('chapter: ' + req.body.chapter);

                    imageArray.map(img => {
                        comicChapter.image.push({
                            name: img.originalname,
                            url: img.key,
                        });
                        console.log('name: ' + img.originalname);
                        console.log('url: ' + img.key);
                    });
                    resolve();
                    var link = `/me/stored/comics/${req.params.slug}/chapter-list`
                    res.status(201).redirect(link);
                    req.flash('success-message', 'Tạo chapter thành công !!')                
                });
            }

            saveURLToDb()
                .then(() => comicChapter.save())
                .catch((error) => {
                    console.error('> Error>', error);
                })

            //res.send(`Your files has been uploaded.`)
            // res.status(201).redirect('/me/stored/manga');

        } catch (error) {
            // Nếu có lỗi thì debug lỗi xem là gì ở đây
            debug(error);

            // Bắt luôn lỗi vượt quá số lượng file cho phép tải lên trong 1 lần
            if (error.code === "LIMIT_UNEXPECTED_FILE") {
                return res.send(`Upload không quá 200 files.`);
            }

            return res.send(`Error when trying upload many files: ${error}}`);
        }
    };


    thumbnailUpload = async (req, res) => {
        try {
            await S3ThumbnailUploadMiddleware(req, res);

            // Nếu upload thành công, không lỗi thì tất cả các file của bạn sẽ được lưu trong biến req.files
            debug(req.files);

            // Mình kiểm tra thêm một bước nữa, nếu như không có file nào được gửi lên thì trả về thông báo cho client
            //parseFloat thì chữ abc sẽ mất, còn số giữ lại

            const thumbnail = req.file;
            console.log(thumbnail)

            Comic.findOne({ slug: req.params.slug })
                .then(comic => {
                    // console.log(course) // check course
                    if (comic.thumbnail.length == 0) {
                        console.log('Thực hiện đăng thumbnail: ')
                        console.log('1. Đưa link url vào mongodb')
                        comic.thumbnail.push({
                            url: thumbnail.key
                        });
                        comic.save().then(res.status(200).redirect('back'));
                    }
                    else {

                        console.log('Thực hiện chỉnh sửa thumbnail: ')
                        Comic.findOne({ slug: req.params.slug })
                            .then(comic => {
                                S3DeleteMiddleWare(comic.thumbnail, function (err) {
                                    if (err) { return next(err) }
                                });
                            })
                            .catch(err => console.log("error >> " + err));

                        Comic.updateOne({ slug: req.params.slug }, {
                            $set: {
                                thumbnail: {
                                    url: thumbnail.key
                                }
                            }
                        })
                        .then(() => {
                            res.status(200).redirect('back');
                            req.flash('success-message', 'Chỉnh sửa thumbnail thành công')
                          })
                        .catch(err => console.log("error >> " + err));
                        
                    }
                })

            //res.send(`Your files has been uploaded.`)
            // res.status(201).redirect('/me/stored/manga');

        } catch (error) {
            // Nếu có lỗi thì debug lỗi xem là gì ở đây
            debug(error);

            // Bắt luôn lỗi vượt quá số lượng file cho phép tải lên trong 1 lần
            if (error.code === "LIMIT_UNEXPECTED_FILE") {
                return res.send(`Upload không quá 200 files.`);
            }

            return res.send(`Error when trying upload many files: ${error}}`);
        }
    };

}

//export (SiteController) thì lát require nhận được nó
module.exports = new S3UploadController();
