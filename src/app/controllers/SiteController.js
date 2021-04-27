//Mô hình mvc: từ clients --> 1. request lên controller --> 2. chọc vào model
// --> 3. lấy được dữ liệu mang về controller --> 4. chọc sang views, lấy data
// từ model truyền sang views --> 5. views render trả về client



const Comic     = require('../models/Comic');
const Chapter   = require('../models/Chapter');
const TimeDifferent = require('../../config/middleware/TimeDifferent')
//cái dấu { } này để import từng phần tử bên trong
const { singleMongooseToObject, multiMongooseToObject } =  require('../../util/mongoose');

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
        
        Comic.find({ chaptername: { $not: { $exists: true } } })
        .select('title description thumbnail slug')
        
        //3. 
        .then(courses => { //4.       
                
            res.render('home', { 
                layout: 'adminMain',
                courses: multiMongooseToObject(courses)
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
