const randomToken = require('random-token');
const sharp = require('sharp');
const s3 = require("../config/bucket.js");

module.exports = bucket => {
    const convertPicture = (buffer, fileFormat, width, height) => new Promise((resolve, reject) => {
        sharp(buffer)
            .resize(width, height, {
                kernel: sharp.kernel.lanczos2,
                interpolator: sharp.interpolator.nohalo
            })
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
    });
  
    const uploadToBucket = (rawBuffer, namespace, fileFormat, width, height, callback) => {
        convertPicture(rawBuffer, fileFormat, width, height)
            .then(buffer => {
                    const key = `${namespace}/${randomToken(32)}.jpeg`;
                    const params = {
                        Bucket: bucket,
                        Body: buffer,
                        Key: key,
                        ContentType: `image/jpeg`
                    };

                    s3.upload(params, (err, pres) => {
                        if (err) {
                            return callback(err);
                        }

                        return callback(null, pres.Location);
                    });
            });
    };

    const uploadFileToBucket = (rawBuffer, namespace, fileFormat, width, height, callback) => {
        const key = `${namespace}/${randomToken(32)}.pdf`;

        const params = {
            Bucket: bucket,
            Body: buffer,
            Key: key,
            ContentType: `application/pdf`
        };

        s3.upload(params, (err, pres) => {
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
