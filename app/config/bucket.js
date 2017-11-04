var AWS = require("aws-sdk");
var config = require("./configProvider.js")();
    
AWS.config.region = config["s3.region"] || "eu-central-1";

const s3 = new AWS.S3();

module.exports = s3;

