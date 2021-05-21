const AWS = require('aws-sdk');
const S3 = require('aws-sdk/clients/s3');
const multer = require('multer');
const path = require("path");
const Chapter = require('../models/Chapter');
const wasabiEndpoint = new AWS.Endpoint(process.env.WASABI_ENDPOINT);

const s3Config = new AWS.S3({
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY
});

var self = module.exports = {
    uploadMultiple: (file, folderPath) => {
        return new Promise(resolve => {
            cloudinary.uploader.upload(file, {
                folder: 'home' + '/' + folderPath
            })
                .then(result => {
                    console.log(result)
                    // Xóa image lưu trong ổ cứng: src/uploadResults
                    const fs = require('fs')
                    fs.unlinkSync(file)
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id,
                        thumb1: self.reSizeImage(result.public_id, 200, 200),
                        main: self.reSizeImage(result.public_id, 500, 500),
                        thumb2: self.reSizeImage(result.public_id, 300, 300)
                    })
                })
        })
    }
}