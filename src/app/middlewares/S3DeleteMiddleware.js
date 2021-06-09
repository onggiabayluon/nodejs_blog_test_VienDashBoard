module.exports = function destroyTodoImage(filename, callback) {
  const AWS = require('aws-sdk');
  const wasabiEndpoint = new AWS.Endpoint(process.env.WASABI_ENDPOINT);
  const s3 = new AWS.S3({
    endpoint: wasabiEndpoint,
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
    region: process.env.WASABI_REGION
  });

  const imgKeys = filename.map(img => {
    return { Key: img.url }
  });

  var params = {
    Bucket: process.env.WASABI_BUCKET_NAME,
    Delete: {
      Objects: imgKeys,
      Quiet: false
    }
  };

  s3.deleteObjects(params, function (err, data) {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      console.log(data)
      callback(null);
    }
  });
}