const AWS = require("aws-sdk");
    
AWS.config.region = process.env.AWS_S3_REGION || "eu-central-1";

const s3 = new AWS.S3();

module.exports = s3;
