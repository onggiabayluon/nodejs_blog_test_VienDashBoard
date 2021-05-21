//Mô hình mvc: từ clients --> 1. request lên controller --> 2. chọc vào model
// --> 3. lấy được dữ liệu mang về controller --> 4. chọc sang views, lấy data
// từ model truyền sang views --> 5. views render trả về client



const Comic     = require('../models/Comic');
const Chapter   = require('../models/Chapter');
const Category  = require('../models/Category')
const ObjectId    = require('mongoose').Types.ObjectId;
const TimeDifferent = require('../../config/middleware/TimeDifferent')
//cái dấu { } này để import từng phần tử bên trong
const { singleMongooseToObject, multiMongooseToObject } =  require('../../util/mongoose');
const User = require('../models/User');

class SiteController {

    dashboardPage(req, res, next) {
        
        res.render('users/dashboard', {
            layout: `${req.user.role}Main`,
            user: singleMongooseToObject(req.user)
        })
    }
    // [GET] / Site
    index(req, res, next) {
       
        //render courses vao homepage
        //2.
        //test
        
    
        // const getDocument = async () => {
        //     try {
        //         //const coursetest = new Course({ title: 'test' });
        //         //coursetest.save()
               
        //         const result = await Course              
        //         .findOne({slug: 'test'})
        //         .then(course => {
        //             course.thumbnail.map(thumbnail => {
        //                 console.log(thumbnail.publicId)
        //             })
                   
        //         })
                
        //     } catch (error) {
        //         console.log(error)
        //     }
        // }
        // getDocument();
        // Comic.updateOne({ slug: 'test-truyen' }, {titleForSearch: 'test'}, {'$set':{titleForSearch: 'testset'}})
        // .then(result => {console.log(result)
        // }
        // Comic.findOne({title: 'test truyện'})
        // .then(page => {
            
        //     console.log(page)
        // })

        const Comment   = require('../models/Comment');
        Comment.findOne({comicSlug: 'wizard-of-anesia'}).lean()
        .select("comicSlug body")
        .then(commentDocArr => {
            // console.log(filterChapterComment(commentDocArr.body, 'chapter-1'))
        })

        /* Comment History */
        // User.findOne({_id: "6084dd9dec23a633c03f96e7"}).lean()
        // .select("comment")
        // .populate("comment")
        // .then(doc => {
        //     console.log(doc.comment.chapterArr)
            
        //     let userComment = doc.comment.chapterArr.filter(x => JSON.stringify(x.userId).includes("6084dd9dec23a633c03f96e7"));
        //     console.log(userComment[0])
        //     //populate user schema từ comment schema
        //     User.populate(userComment[0], {path: 'userId'}).then(u => console.log(u))
        //     // console.log(user.comment.body.filter(filterThisUserComment))
        //     // function filterThisUserComment(commentDocArr) {
        //     //     console.log(commentDocArr.userId)
        //     //     // return commentDocArr.userId == '6084dd9dec23a633c03f96e7'
        //     // }
        // })

        /* Comment  */
        var condition = 'chapter-1'
        Comment.findOne({_id: "607a994a6290a72e18635e53"}).lean()
        // .select("chapterArr")
        .then(doc => {
            console.log(doc.chapterArr)
            
            // let filteredChapters = doc.chapterArr.filter(x => JSON.stringify(x).includes("chapter-1"));
            const filteredChapterArr = (condition != 'all') ? filterChapter(doc.chapterArr, condition) : doc.chapterArr
            console.log("filteredChapterArr: ")
            console.log(filteredChapterArr.sort())

            filteredChapterArr.forEach(filteredChapter => {
                filteredChapter.comments.forEach(comment => {
                    console.log(comment.text)
                });
            });
            // filteredChapters.forEach(chapter => {
            //     chapter.comments.forEach(comment => {
            //         console.log(comment.text)
            //     });
            // });

            //populate user schema từ comment schema
            // User.populate(userComment[0], {path: 'userId'}).then(u => console.log(u))

            // console.log(user.comment.body.filter(filterThisUserComment))
            // function filterThisUserComment(commentDocArr) {
            //     console.log(commentDocArr.userId)
            //     // return commentDocArr.userId == '6084dd9dec23a633c03f96e7'
            // }
        })
        function filterChapter(chapterArr, condition) {
            var result = []
            for (let i = 0; i < chapterArr.length; i++) {
                if (chapterArr[i].chapter == condition) {
                    result = [chapterArr[i]]
                    break;
                }
            }
            return result;
        }
        //temp
        // User.findOne({_id: "6084dd9dec23a633c03f96e7"}).lean()
        // // .select("comment")
        // .populate("comment", "comments -_id")
        // .then(doc => {
        //     // console.log(doc.comment.comments)
        //     let userComment = doc.comment.comments.filter(x => JSON.stringify(x.userId).includes("6084dd9dec23a633c03f96e7"));
        //     console.log(userComment)
        //     // console.log(user.comment.body.filter(filterThisUserComment))
        //     // function filterThisUserComment(commentDocArr) {
        //     //     console.log(commentDocArr.userId)
        //     //     // return commentDocArr.userId == '6084dd9dec23a633c03f96e7'
        //     // }
        // })

        

        // Comic.findOneAndUpdate({
        //     slug: 'toi-la-nguoi-choi-duy-nhat-dang-nhap'
        // }, { $pullAll: { category: [ '609f24f0ce319201845e45cd' ] } }).exec()
        
        // var test = new ObjectId('603a068034d84d21247cdb22')
        // console.log(test)
        // Category.findOneAndUpdate(
        //     { _id: '609f24f0ce319201845e45cd'}, 
        //     { $pull: { comic: '603a068034d84d21247cdb22'  } },
        //     function(error, doc) {
        //       console.log('Error: ' + error);
        //       console.log(JSON.stringify(doc));
        //     })

        // Comic.findOneAndUpdate({
        //     slug: 'toi-la-nguoi-choi-duy-nhat-dang-nhap'
        // }, 
        // { $addToSet: { category: { $each: [ "609f250ace319201845e45ce", "609f250ace319201245e45ce", "601d118d4488cb18084a57bc" ] } } }
        // ).exec().then(console.log('cuss'))

        // Comic.findOneAndUpdate({
        //     slug: 'toi-la-nguoi-choi-duy-nhat-dang-nhap'
        // }, {
        //     $addToSet: {
        //         category: '609f250ace3192018 45e45ce'
        //     }
        // }).exec()

        // Comic
        // .findOne({slug: 'toi-la-nguoi-choi-duy-nhat-dang-nhap'})
        // .populate("category", "name -_id")
        // .then( comic => {

        //     console.log(comic) // Return result as soon as you can
        //     comic.save(); // Save user without dead refs to database
        // })

        // Comic
        // .findOne({slug: 'toi-la-nguoi-choi-duy-nhat-dang-nhap'})
        // .lean().populate("category", "name -_id")
        // .then( comic => {
        //     delete comic.category // xai delete de chinh sua field tai. cho

        //     console.log(comic) // Return result as soon as you can
        //     comic.save(); // khong the edit trong database do su dung lean
        // })

        // .populate(Comic)
        Comic.find({ chaptername: { $not: { $exists: true } } })
        .select('title description thumbnail slug')
        
        //3. 
        .then(courses => { //4.       
            res.render('home', { 
                layout: 'adminMain',
                courses: multiMongooseToObject(courses),
                user: singleMongooseToObject(req.user)
             });
        })
        .catch(error => next(error));

    }
    
    // [GET] / search
    search(req, res, next) {
        let hint = "";
        let response = "";
        let searchQ = req.body.data.toLowerCase()
        
        if (searchQ.length > 0) {
            // titleForSearch là cho search không dấu
            Comic.find({ $or: [{ titleForSearch: { $regex: searchQ, $options: "i" } }, { title: { $regex: searchQ, $options: "i" }}] })
            .then(results => {
                results.map(comic => {
                    var time = TimeDifferent(comic.updatedAt)
                    comic["comicUpdateTime"] = time;
                  })
                res.render('me/page.hbs', { 
                    layout: 'page',
                    comics: multiMongooseToObject(results)
                 });
            });
        } else {
            Comic.find({ title: { $regex: searchQ, $options: "i" } })
            .then(results => {
                results.map(comic => {
                    var time = TimeDifferent(comic.updatedAt)
                    comic["comicUpdateTime"] = time;
                  })
                res.render('me/page.hbs', { 
                    layout: 'page',
                    comics: multiMongooseToObject(results)
                 });
            })
        }
        console.log("data from server: " + searchQ);
    }
}

//export (SiteController) thì lát require nhận được nó
module.exports = new SiteController();
