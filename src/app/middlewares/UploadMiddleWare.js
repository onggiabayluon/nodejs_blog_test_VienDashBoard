// Variables
const AWS               = require('aws-sdk');
const wasabiEndpoint    = new AWS.Endpoint(process.env.WASABI_ENDPOINT);
const sharp             = require("sharp");
// S3 config
const s3 = new AWS.S3({
    endpoint: wasabiEndpoint,
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
});

var self = module.exports = {
    uploadMultiple: async (files, params) => {
        const images = [];

        const resizePromises = files.map(async (file) => {
            const filename = `${params.slug}/${params.chapter}/${Date.now()}-${file.originalname.replace(/\..+$/, "")}`;
            console.log(filename)
             sharp(file.buffer)
                .resize({ width: 1000 , fit: 'contain'})
                .jpeg({ quality: 90 })
                .toBuffer()
                .then(resized => s3.upload({
                    ACL: 'public-read',
                    Body: resized,
                    Bucket: process.env.WASABI_BUCKET_NAME,
                    ContentType: file.mimetype,
                    CacheControl: 'max-age=31536000',
                    Key: `${filename}-large.jpg`,
                }).promise())
             sharp(file.buffer)
                .resize({ width: 690 , fit: 'contain'})
                .webp({ quality: 90 })
                .toBuffer()
                .then(resized => s3.upload({
                    ACL: 'public-read',
                    Body: resized,
                    Bucket: process.env.WASABI_BUCKET_NAME,
                    ContentType: 'image/webp',
                    CacheControl: 'max-age=31536000',
                    Key: `${filename}-medium.webp`,
                }).promise())
             sharp(file.buffer)
                .resize({ width: 400 , fit: 'contain'})
                .webp({ quality: 90 })
                .toBuffer()
                .then(resized => s3.upload({
                    ACL: 'public-read',
                    Body: resized,
                    Bucket: process.env.WASABI_BUCKET_NAME,
                    ContentType: 'image/webp',
                    CacheControl: 'max-age=31536000',
                    Key: `${filename}-small.webp`,
                }).promise())

                images.push({url: filename});
               
        });

        
        await Promise.all([...resizePromises]).then(console.log('done upload'));

        return images
    }
}