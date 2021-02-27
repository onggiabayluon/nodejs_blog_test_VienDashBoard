var cloudinary = require('cloudinary').v2;
//lấy trong https://cloudinary.com/console/welcome
cloudinary.config({
    cloud_name: 'dwajvm53v',
    api_key: '485633522843934',
    api_secret: 'gZYmgO8732Xzcms1AJeU1_ReCGU'
});

var self = module.exports = {
    uploadSingle: (file, folderPath) => {
        return new Promise(resolve => {
            cloudinary.uploader.upload(file, {
                // responsive_breakpoints: [{
                //     create_derived: false,
                //     bytes_step: 20000,
                //     min_width: 200,
                //     max_width: 1000,
                //     //max_images: 20
                //     }], 
                    quality: "auto",
                    crop: "scale",
                    folder: 'home' + '/' + folderPath + '/' + 'thumbnail'
                })
                .then(result => {  
                    console.log(result) 
                    const fs = require('fs')
                        fs.unlinkSync(file)
                        resolve({
                            file_name: result.original_filename,
                            url: result.secure_url,
                            public_id: result.public_id,
                            thumb1: self.reSizeImage(result.public_id, 200, 200),
                            main: self.reSizeImage(result.public_id, 500, 500),
                            thumb2: self.reSizeImage(result.public_id, 300, 300)
                        })
                        // res
                        // .status(HttpStatus.OK)
                        // .json({ message: 'Image deleted successfully' })
                })
        })
    },
    uploadMultiple: (file, folderPath) => {
        return new Promise(resolve => {
            cloudinary.uploader.upload(file, {       
                // responsive_breakpoints: [{
                //     create_derived: false,
                //     bytes_step: 20000,
                //     min_width: 200,
                //     max_width: 1000,
                //     //max_images: 20
                //     }], 
                    quality: "auto",
                    crop: "scale",
                    folder: 'home' + '/' + folderPath     
                })
                .then(result => {  
                    console.log(result) 
                    // console.log(result.responsive_breakpoints) 
                        // Xóa image lưu trong ổ cứng: src/uploadResults
                        const fs = require('fs')
                        fs.unlinkSync(file)
                        resolve({
                            file_name: result.original_filename,
                            url: result.secure_url,
                            public_id: result.public_id,
                            thumb1: self.reSizeImage(result.public_id, 200, 200),
                            main: self.reSizeImage(result.public_id, 500, 500),
                            thumb2: self.reSizeImage(result.public_id, 300, 300)
                        })
                })
        })
    },
    deleteMultiple: (imagePublicId) => {
        return new Promise(resolve => {
            cloudinary.uploader.destroy(imagePublicId)
                .then(result => { 
                    // ['result': ok, , ,]
                    console.log(result) 
                        resolve(result)
                })
        })
    },
    reSizeImage: (id, h, w) => {
        return cloudinary.url(id, {
            height: h,
            width: w,
            crop: 'scale',
            format: 'jpg'
        })
    },
}