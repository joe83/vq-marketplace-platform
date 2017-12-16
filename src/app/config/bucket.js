const AWS = require("aws-sdk");
const config = require("./configProvider.js")();
    
AWS.config.region = config.AWS_S3_REGION || "eu-central-1";

const s3 = new AWS.S3();

module.exports = s3;
