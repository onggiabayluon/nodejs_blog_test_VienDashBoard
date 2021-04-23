module.exports = function destroyTodoImage (filename, callback) {
    const aws = require('aws-sdk');
    const s3 = new aws.S3({
        accessKeyId: process.env.AWS_IAM_USER_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_IAM_USER_SECRET_ACCESS_KEY,
        Bucket: process.env.AWS_BUCKET_NAME,
        region: 'us-east-1'
      });

    const imgKeys = filename.map(img => {
      return { Key: img.url }
    });

    var params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Delete: {
        Objects: imgKeys,
        Quiet: false
       }
    };

    s3.deleteObjects(params, function(err, data) {
      if (err) {
        console.log(err);
        callback(err);
      } else {
        console.log(data)
        callback(null);
      }
    });
  }