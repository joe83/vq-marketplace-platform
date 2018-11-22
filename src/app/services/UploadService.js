const randomToken = require("random-token");
const sharp = require("sharp");
const s3 = require("../config/bucket.js");

module.exports = bucket => {
    const convertPicture = (buffer, fileFormat, width, height) =>
    new Promise((resolve, reject) => {
        
        if (width && height) {
            return sharp(buffer)
                .resize(width, height)
                .crop(sharp.strategy.entropy)
                // .background('white')
                // .embed()
                .toBuffer((err, imgBuffer) => {
                    if (err) {
                        console.error(err);

                        return reject(err);
                    }
                    
                    return resolve(imgBuffer);
                });
        }

        return sharp(buffer)
            .toBuffer((err, imgBuffer) => {
                if (err) {
                    console.error(err);

                    return reject(err);
                }
                
                return resolve(imgBuffer);
            });
    });
  
    const uploadToBucket = (rawBuffer, namespace, fileFormat, width, height, callback) => {
        convertPicture(rawBuffer, fileFormat, width, height)
            .then(buffer => {
                    const key = `${namespace}/${randomToken(32)}.jpeg`;
                    const params = {
                        Bucket: bucket,
                        Body: buffer,
                        Key: key,
                        ContentType: "image/jpeg"
                    };

                    s3
                    .upload(params, (err, pres) => {
                        if (err) {
                            return callback(err);
                        }

                        return callback(null, pres.Location);
                    });
            });
    };
   
    const uploadFileToBucket = (rawBuffer, namespace, fileFormat, callback) => {
        const key = `${namespace}/${randomToken(32)}.${fileFormat}`;

        const params = {
            Bucket: bucket,
            Body: rawBuffer,
            Key: key,
            ContentType: "application/pdf"
        };

        s3
        .upload(params, (err, pres) => {
            if (err) {
                return callback(err);
            }

            return callback(null, pres.Location);
        });
    };

    return {
        uploadFileToBucket,
        uploadToBucket
    };
};
