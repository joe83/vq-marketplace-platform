var AWS = require('aws-sdk');
var config = require("./configProvider.js")();
    
AWS.config.region = config["s3.region"];
AWS.config.update(config["s3.secretAccessKey"]);

var s3 = new AWS.S3();

module.exports = s3;

