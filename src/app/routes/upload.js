const multer = require("multer");
const async = require("async");

// const UploadService = require("../services/UploadService");
const responseController = require("../controllers/responseController");
const isLoggedIn = responseController.isLoggedIn;

// const uploader = UploadService(process.env.AWS_S3_BUCKET);

// @todo
const uploader = {};

module.exports = app => {
    app.post("/api/upload/image",
    isLoggedIn,
    (req, res) => {
        multer({
            limits: {
                fileSize: 5 * 1024 * 1024 // 5MB is the limit
            }
        })
        .single("file")(req, res, err => {
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
    
            const imageBuffer = new Buffer(req.file.buffer);
            const width = Number(req.query.width);
            const height = Number(req.query.height);
    
            /** 
            if (!width && !height) {
                return res.status(400)
                    .send("Width or height is not specifed");
            }
            */
            
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

    app.post("/api/upload/file",
    isLoggedIn,
    (req, res) => {
        multer({
            limits: {
                fileSize: 5 * 1024 * 1024 // 5MB is the limit
            }
        })
        .single("file")(req, res, err => {
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
    
            const fileBuffer = new Buffer(req.file.buffer);

            const mimetype = req.file.mimetype.split("/")[1];
    
            if (mimetype !== "pdf") {
                return res.status(400).send({
                    code: "UNSUPPORTED_FILE_FORMAT"
                });
            }
    
            async.waterfall([
                fn => uploader
                .uploadFileToBucket(fileBuffer, "st", mimetype, (err, locationPath) => {
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
};
