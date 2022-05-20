const FileType = require('file-type');
const aws = require('./awsS3');
const AppError = require('./appError')


module.exports = async (
    imageData,
    modelName,
    modelId
  ) => {
    if (!imageData || !modelName || !modelId )
      throw new AppError('Missing parameters in function', 500);
    const buf = Buffer.from(imageData, 'base64');
  
    const awsObj = new AwsS3Api();
  
    const imgObjects = [];
    const fileMime = (await FileType.fromBuffer(buf)).mime;

    

    const key = `photos/${modelName}-${modelId}.jpeg`;
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/`;

    // eslint-disable-next-line no-await-in-loop
    awsObj.s3.putObject(
    {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
    },
    err => {
        if (err) throw new AppError('Upload validation failed', 500);
    }
    );

    imgObjects.push({
    url: `${url}${key}`,
    });

    return imgObjects;
  };
