const Comic    = require('../models/Comic');
const Chapter    = require('../models/Chapter');
const shortid   = require('shortid');
const multipleUploadMiddleware = require("../../config/middleware/multipleUploadMiddleware");
const singleUploadMiddleware = require("../../config/middleware/singleUploadMiddleware");
const cloudinary = require('../../config/middleware/ModelCloudinary')

let debug = console.log.bind(console);
class UploadController {

    /**
 * Created by trungquandev.com's author on 17/08/2019.
 * multipleUploadController.js
 */
    // [POST] / :slug / multipleUpload
    multipleUpload = async (req, res) => {
        try {
            // thực hiện upload
            // console.log(req.files)
            // return console.log(req.files)
            await multipleUploadMiddleware(req, res);

            // Nếu upload thành công, không lỗi thì tất cả các file của bạn sẽ được lưu trong biến req.files
            debug(req.files);

            // Mình kiểm tra thêm một bước nữa, nếu như không có file nào được gửi lên thì trả về thông báo cho client
            //parseFloat thì chữ abc sẽ mất, còn số giữ lại
            var chapter = parseFloat(req.body.chapter);
            if (req.files.length <= 0) {
                return res.send(`You must select at least 1 file or more.`);
            } else if(!chapter)
                return res.send(`bạn chưa điền vào cột chapter hoặc bạn nhập không phải số`);
            // trả về cho người dùng cái thông báo đơn giản.
            // const files = req.files;
            var databaseFolderPath = req.params.slug + '/' + req.body.chapter 
            let res_promises = req.files.map(file => new Promise((resolve, reject) => {
                cloudinary.uploadMultiple(file.path,databaseFolderPath)
                .then(function(result) {
                    resolve(result);
                })
            }))

            
            // Promise.all get imgas
            Promise.all(res_promises)
                .then(async(arrImg) => {
                    const comicChapter = new Chapter(req.body);
                    comicChapter.chapter = 'chapter-' + req.body.chapter
                    comicChapter.title = 'chapter of ' + req.params.slug
                    comicChapter.chapterSlug = req.params.slug + '-' + shortid();
                    comicChapter.comicSlug = req.params.slug

                    //chapter.chapter = req.body.chapter.removeVnmese......

                    console.log('title: ' +  comicChapter.title);
                    console.log('comicSlug: ' +  comicChapter.comicSlug);
                    console.log('chapter: ' + req.body.chapter);

                    let Img = arrImg.map(img => { 
                        comicChapter.image.push({
                            name: img.file_name,
                            url: img.url,
                            publicId: img.public_id,
                        });
                        
                        console.log('url: ' + img.url);
                        console.log('publicId: ' + img.public_id);
                    })
                    comicChapter.save();
                    // arrImg chính là array mà chúng ta đã upload 
                    // các bạn có thể sử dụng arrImg để save vào database, hay hơn thì sử dụng mongodb
                    // console.log(arrImg)
                })
                .catch((error) => {
                    console.error('> Error>', error);
                })

            //res.send(`Your files has been uploaded.`)
            res.status(201).redirect('/me/stored/manga');
            
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

    singleUpload = async (req, res) => {
        try {
            // console.log(req.file);
            // thực hiện upload
            await singleUploadMiddleware(req, res);

            // Nếu upload thành công, không lỗi thì tất cả các file của bạn sẽ được lưu trong biến req.files
            debug(req.file);

            // Mình kiểm tra thêm một bước nữa, nếu như không có file nào được gửi lên thì trả về thông báo cho client
            if (!req.file) {
                return res.send(`You must select at least 1 file.`);
            }
            // trả về cho người dùng cái thông báo đơn giản.
            const file = req.file;
            var databaseFolderPath = req.params.slug
            
                cloudinary.uploadSingle(file.path,databaseFolderPath)
                .then(img => {
                   // console.log(img) // img sau khi up len cloudinary
                    Comic.findOne({slug: req.params.slug})
                    .then(comic => {
                       // console.log(Comic) // check Comic
                        if (comic.thumbnail.length == 0) {
                            console.log('Thực hiện đăng thumbnail: ')
                            console.log('1. Đưa link url vào mongodb')
                            comic.thumbnail.push({
                                url: img.url,
                                publicId: img.public_id,
                            });
                            comic.save();
                        }
                       else {
                            console.log('Thực hiện chỉnh sửa thumbnail: ')
                            Comic.findOne({slug: req.params.slug})
                            .then(comic => {
                                comic.thumbnail.map(thumbnail => {
                                //console.log(thumbnail.publicId)
                                cloudinary.deleteMultiple(thumbnail.publicId)
                                    .then(result => {
                                            console.log("-- Xóa thumbnail trên cloudinary: ")
                                            console.log(result)
                                        })
                                    .catch((error) => {
                                            console.error('> Error>', error);
                                        })    
                                    })
                                });
                            
                           
                            Comic.updateOne({ slug: req.params.slug }, {
                                $set: {
                                    thumbnail: {
                                        name: img.file_name,
                                        url: img.url,
                                        publicId: img.public_id,
                                    }
                                }
                            }, function (err, res) {
                                console.log("-- Mongodb thumbnail updated: " + res.nModified);
                               
                            })
                       }
                        // console.log('-- Kết thúc --')
                        // console.log('url: ' + img.url);
                        // console.log('publicId: ' + img.public_id);
                        })
                    })
                    .catch((error) => {
                        console.error('> Error>', error);
                    })
                    
            //res.send(`Your files has been uploaded.`)
            res.status(201).redirect('/me/stored/comics/comic-list');
            
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
module.exports = new UploadController();
