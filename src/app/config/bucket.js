const AWS = require("aws-sdk");

AWS.config.region = process.env.AWS_S3_REGION || "eu-central-1";
AWS.config.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
AWS.config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new AWS.S3();

module.exports = s3;
