import * as multer from "multer";
import * as async from "async";

const responseController = require("../controllers/responseController");
const isLoggedIn = responseController.isLoggedIn;

const randomToken = require("random-token");

import { Application } from "express";
import { VQ } from "../../core/interfaces";
import { writeFile } from 'fs';

export default (app: Application) => {
    /**
     * Upload of PDFs, PNGs and JPEGS
     * Limited to 5 MB
     * Example call:
        const formData = new FormData();

        // file is from multipart form
        formData.append("file", file);

        http.post(`/api/upload/file`, formData);
     */
    app.post("/api/upload/file",
        isLoggedIn,
        (req, res) => {
            multer({
                limits: {
                    fileSize: 5 * 1024 * 1024 // 5MB is the limit
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
                        const name = randomToken(32);
                        const fileStoragePath = process.env.FILE_UPLOAD_DIRECTORY + "/" + name + "." + mimetype;

                        writeFile(fileStoragePath, req.file.buffer, (err) => {
                            if (err) {
                                return fn({
                                    code: "UPLOAD_ERROR",
                                    message: "Failed to write to file.",
                                    httpCode: 500
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

    /**
    app.post("/api/upload/image",
    isLoggedIn,
    (req, res) => {
        multer({
            limits: {
                fileSize: 5 * 1024 * 1024 // 5MB is the limit
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
            const UploadService = require("../services/UploadService");
            const uploader = UploadService(process.env.AWS_S3_BUCKET);

            const imageBuffer = new Buffer(req.file.buffer);
            const width = Number(req.query.width);
            const height = Number(req.query.height);
    
            const mimetype = req.file.mimetype.split("/")[1];
    
            if (mimetype !== "jpeg" && mimetype !== "png") {
                return res.status(400).send({
                    code: "UNSUPPORTED_IMAGE_FORMAT"
                });
            }
    
            async.waterfall([
                fn => uploader
                .uploadToBucket(imageBuffer, req.models.tenantId, mimetype, width, height, (err, locationPath) => {
                    if (err) {
                        return fn(err, locationPath);
                    }
    
                    return fn(null, locationPath);
                })
            ], (err, locationPath) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send(err);
                }
    
                res.status(200).send(req.query.json ? {
                    url: locationPath 
                } : locationPath);
            });
        });
    });
    */
};


/**
 Example upload to AWS
    const UploadService = require("../services/UploadService");
    const uploader = UploadService(process.env.AWS_S3_BUCKET);
    const fileBuffer = new Buffer(req.file.buffer);

    uploader
    .uploadFileToBucket(fileBuffer, "st", mimetype, (err, locationPath) => {
        if (err) {
            return fn(err, locationPath);
        }

        return fn(null, locationPath);
    })
*/
