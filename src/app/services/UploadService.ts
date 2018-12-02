const randomToken = require("random-token");
const sharp = require("sharp");
const s3 = require("../config/bucket.js");

module.exports = (bucket: string) => {
    const convertPicture = async (buffer: any, width: number, height: number) => {
        let processedImage = sharp(buffer);

        if (width && !height) {
            processedImage = processedImage.resize({ width });
        }

        if (width && height) {
            processedImage = processedImage.resize(width, height).crop(sharp.strategy.entropy);
        }

        return await processedImage.toBuffer();
    };

    const uploadToBucket = async (
        rawBuffer: any,
        namespace: string,
        fileFormat: "jpeg" | "png",
        width: number,
        height: number,
        callback: (err: any, url?: string) => void
    ) => {
        const buffer = await convertPicture(rawBuffer, width, height);

        const key = `${namespace}/${randomToken(32)}.jpeg`;
        const params = {
            Body: buffer,
            Bucket: bucket,
            ContentType: "image/jpeg",
            Key: key
        };

        s3.upload(params, (err: any, pres: { Location: string }) => {
            if (err) {
                return callback(err);
            }

            return callback(null, pres.Location);
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
