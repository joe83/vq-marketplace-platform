const async = require("async");
const responseController = require("../controllers/responseController.js");
const isLoggedIn = responseController.isLoggedIn;
const identifyUser = responseController.identifyUser;

import { VQ } from "../../core/interfaces";
import * as userCtrl from "../controllers/userCtrl";

module.exports = (app) => {
  app.get("/api/user/:userId/property", identifyUser, (req, res) => {
    const userId = req.params.userId;

    async
        .waterfall([
            cb => req.models
                .userProperty
                .findAll({
                    where: { 
                        userId
                    }
                })
                .then(properties =>
                    cb(null, properties)
                , cb)
        ], (err, properties) => {
            responseController
            .sendResponse(res, err, properties);
        });
  });

  app.post("/api/user/:userId/property", isLoggedIn, (req, res) => {
    userCtrl.updateProperty(req.models, req.user.id, req.body.propKey, req.body.propValue, (err, savedProperty) => {
        responseController.sendResponse(res, err, savedProperty);
    });
  });
};
