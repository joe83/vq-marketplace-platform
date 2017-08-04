var multer = require("multer");
var async = require("async");
var UploadService = require("../services/UploadService");
var responseController = require("../controllers/responseController");
var isLoggedIn = responseController.isLoggedIn;

var uploader = UploadService('viciqloud', 'egamix');

module.exports = app => {
    app.post('/api/upload/image', isLoggedIn, multer().single('file'), (req, res) => {
        if (!req.file) {
            return res.status(400).send("No files uploaded!");
        }

        const userId = req.user.id;
        const imageBuffer = new Buffer(req.file.buffer);
        const width = Number(req.query.width);
        const height = Number(req.query.height);

         if (!width && !height) {
            return res.status(400).send("Width or height is not specifed");
        }

        async.waterfall([
            fn => uploader
            .uploadToBucket(imageBuffer, 'st', req.file.mimetype.split('/')[1], width, height, (err, locationPath) => {
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
};
