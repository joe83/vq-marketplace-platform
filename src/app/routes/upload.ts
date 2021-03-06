import * as multer from "multer";
import * as async from "async";
import { Application } from "express";
import { VQ } from "../../core/interfaces";
import { IVQRequest } from '../interfaces';
import { writeFile } from 'fs';

const responseController = require("../controllers/responseController");
const isLoggedIn = responseController.isLoggedIn;
const randomToken = require("random-token");
const UploadService = require("../services/UploadService");

/**
 * Requires configuration for FILE_UPLOAD_DIRECTORY
 */
require('dotenv').config();

export default (app: Application) => {
    /**
     * @api {put} /api/upload/file Uploads file
     * @apiVersion 0.0.2
     * @apiName UploadFile
     * @apiGroup Upload
     * @apiPermission user
     * @apiDescription
     * API endpoint for uploading documents. Documents can be in the following formats: pdf, png and jpeg. Upload is limited to 5MB.
     * @apiExample {js} JS
        const formData = new FormData();

        const inputField = document.querySelector("input[type='file']");

        formData.append("file", inputField.file);

        fetch('/api/upload/file', {
            method: 'POST',
            body: formData,
            headers: {
                "x-auth-token": "YOUR_TOKEN"
            }
        })
        .then(response => response.json())
        .then(response => console.log('Success:', JSON.stringify(response)))
        .catch(error => console.error('Error:', error));
     * @apiSuccess {string} url Name of the file
     * @apiSuccessExample {json} Success-Response
     * {  url: "b28xxuf91eduelo4gnb3hsdb61ufza4z.pdf" }
     */
    app.post("/api/upload/file",
        isLoggedIn,
        (req: IVQRequest, res) => {
            multer({
                limits: {
                    fileSize: Number(process.env.FILE_UPLOAD_LIMIT || 5) * 1024 * 1024 // 5MB is the limit by default
                }
            })
            .single("file")(req, res, (err: any) => {
                if (err) {
                    if (err.code === "LIMIT_FILE_SIZE") {
                        return res.status(400).send({
                            code: "LIMIT_IMAGE_SIZE"
                        });
                    }
                }

                if (!req.file) {
                    return res.status(400).send("No files uploaded!");
                }

                const mimetype = req.file.mimetype.split("/")[1];

                if (mimetype !== "pdf" && mimetype !== "jpeg" && mimetype !== "png") {
                    return res.status(400).send({
                        code: "UNSUPPORTED_FILE_FORMAT",
                        message: `Type "${mimetype}" is not supported. Only supported: pdf, jpeg, png`
                    });
                }

                async.waterfall([
                    (fn: VQ.StandardCallback) => {
                        const name = randomToken(32) + "." + mimetype;
                        const fileStoragePath = process.env.FILE_UPLOAD_DIRECTORY + "/" + name;

                        writeFile(fileStoragePath, req.file.buffer, (err) => {
                            if (err) {
                                return fn({
                                    code: "UPLOAD_ERROR",
                                    httpCode: 500,
                                    message: "Failed to write to file."
                                });
                            }

                            console.log(`${fileStoragePath} was saved!`);

                            return fn(null, name);
                        });
                    }
                ], (err: VQ.APIError, locationPath: string) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send(err);
                    }

                    res.status(200).send({
                        url: locationPath
                    });
                });
            });
        });


    app.post("/api/upload/image",
    isLoggedIn,
    (req: IVQRequest, res) => {
        multer({
            limits: {
                fileSize: 5 * 1024 * 1024 // 5MB is the limit
            }
        })
        .single("files[]")(req, res, (err: any) => {
            if (err) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).send({
                        code: "LIMIT_IMAGE_SIZE"
                    });
                }
            }

            if (!req.file) {
                return res.status(400).send("No files uploaded!");
            }

            const query = req.query as {
                isProfileAvatar: boolean
            };

            const uploader = UploadService(process.env.AWS_S3_BUCKET);

            const imageBuffer = new Buffer(req.file.buffer);
            let width = 800;
            let height: number;

            if (query.isProfileAvatar) {
                width = 150 || Number(req.query.width);
                height = 150 ||  Number(req.query.height);
            }

            const mimetype = req.file.mimetype.split("/")[1];

            if (mimetype !== "jpeg" && mimetype !== "png") {
                return res.status(400).send({
                    code: "UNSUPPORTED_IMAGE_FORMAT"
                });
            }

            async.waterfall([
                (fn: VQ.StandardCallback) => uploader.uploadToBucket(
                    imageBuffer,
                    req.models.tenantId,
                    mimetype,
                    width,
                    height,
                    fn
                )
            ], async (err2: any, locationPath) => {
                if (err2) {
                    return res.status(500).send(err2);
                }

                if (query.isProfileAvatar) {
                    const user = await req.models.user.findById(req.user.id);

                    user.imageUrl = locationPath;

                    await user.save();
                }

                res.status(200).send({
                    files: [
                        { url: locationPath }
                    ]
                });
            });
        });
    });
};

/**
 Example upload to AWS
    const UploadService = require("../services/UploadService");
    const uploader = UploadService(process.env.AWS_S3_BUCKET);
    const fileBuffer = new Buffer(req.file.buffer);

    uploader
    .uploadFileToBucket(fileBuffer, "st", mimetype, (err, locationPath) => {
        if (err) {
            return fn(err, locationPath);yes
        }

        return fn(null, locationPath);
    })
*/
