const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');

class aws {
  constructor(s3) {
    if (s3) this.s3 = s3;
    else
      this.s3 = new AWS.S3({
        accessKeyId: process.env.S3_AWS_ACCESS_KEY,
        secretAccessKey: process.env.S3_AWS_SECRET_KEY,
        region: process.env.S3_AWS_REGION,
        httpOptions: {
          timeout: 900000 
        }
      });
  }

  setMulterStorage(s3, bucket, metadata, key) {
    const storage = {};
    if (s3) storage.s3 = s3;
    else storage.s3 = this.s3;
    if (bucket) storage.bucket = bucket;
    else storage.bucket = process.env.S3_AWS_BUCKET_NAME;
    if (metadata) storage.metadata = metadata;
    else {
      storage.metadata = function(req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      };
    }
    if (key) storage.key = key;
    else {
      storage.key = function(req, file, cb) {
        cb(null, Date.now().toString());
      };
    }

    this.multerStorage = multerS3(storage);
  }

  setMulterUploadOptions(options) {
    const multerOptions = { storage: this.multerStorage };
    if (options) Object.assign(multerOptions, options);
    else {
      multerOptions.limits = { fields: 1, fileSize: 10e9, files: 4, parts: 2 };
    }
    this.upload = multer(multerOptions);
  }

  async getHeadObject(Key) {
    return await this.s3
      .headObject({
        Key,
        Bucket: process.env.AWS_BUCKET_NAME
      })
      .promise();
  }

  getMulterUpload() {
    return this.upload;
  }

  getS3Obj() {
    return this.s3;
  }

  s3Download(Key) {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key
    };
    this.s3.getObject(params, function(err, data) {
      if (err) return err;
      return data;
    });
  }

  s3createReadStream(Key, Range) {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key
    };
    if (Range) params.Range = Range;
    this.s3Obj = this.s3.getObject(params);
    return this.s3Obj.createReadStream();
  }
}

module.exports = aws;