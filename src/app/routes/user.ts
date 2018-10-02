const responseController = require("../controllers/responseController.js");

import * as async from "async";
import { Application } from "express";
import { VQ } from "../../core/interfaces";
import * as userCtrl from "../controllers/userCtrl";

const isLoggedIn = responseController.isLoggedIn;
const sendResponse = responseController.sendResponse;

module.exports = (app: Application) => {
  app.get("/api/me", isLoggedIn, (req, res) => {
      return sendResponse(res, null, req.user);
  });

  app.get("/api/user/:userId", (req, res) => {
    req.models.user.findOne({
      where:
        { 
          id: req.params.userId 
        },
        include: [
          { model: req.models.userProperty },
          { model: req.models.userPreference }
        ]
    })
    .then(
      user => {
        user = JSON.parse(JSON.stringify(user));

        if (req.user && !req.user.isAdmin && req.query.adminView) {
          user.userProperties.forEach(_ => {
              const prop = _;
    
              prop.propValue = Boolean(prop.propValue);
          });
        }

        return sendResponse(res, null, user);
      }, 
      err => sendResponse(res, err)
    );
  });

   /**
     * @api {put} /api/user/:userId Updates user data
     * @apiGroup User
     *
     * @apiParam {String} email Users unique email.
     * @apiParam {String} firstName First name of the User.
     * @apiParam {String} lastName Last name of the User.
     * @apiParam {String="0", "1", "2"} userType User type (any, customer, supplier).
     * @apiParam {Object} props User properties, fully extensible, [key: string]: string
     *
     * @apiSuccess {id} id user ID (is not the same as the account ID of the user)
     */
  app.put("/api/user/:userId", isLoggedIn, (req, res) => {
    const mutableFields = [
      "firstName",
      "lastName",
      "bio",
      "website",
      "imageUrl"
    ];

    const props = req.body.props || {};
    const updateObj: { [key: string]: string } = {};

    try {
      Object
      .keys(req.body)
      .filter(_ => mutableFields.indexOf(_) !== -1)
      .forEach(fieldKey => {
        updateObj[fieldKey] = req.body[fieldKey];
      });
    } catch(err) {
      return sendResponse(res, err);
    }

    let data: any;

    async.parallel([
      /**
       * Update main attributes.
       */
      (cb: VQ.StandardCallback) => {
        req.models
        .user
        .update(updateObj, {
            where: {
                id: req.user.id
            }
        })
        .then(
          (_data: any) => {
            data = _data;

            return cb();
          }, 
          cb
        );
      },
      /**
       * Update properties.
       */
      (cb: VQ.StandardCallback) => {
        async.eachLimit(Object.keys(req.body.props), 5, (propKey: string, cb: VQ.StandardCallback) => {
          userCtrl.updateProperty(
            req.models,
            req.user.id,
            propKey,
            props[propKey],
            (err) => cb(err)
          );
        }, cb);
      }
    ], (err: any) => {
      if (err) {
        return sendResponse(res, err);
      }

      return req.models.user.findOne({
        where:
          { 
            id: req.user.id
          },
          include: [
            { model: req.models.userProperty },
            { model: req.models.userPreference }
          ]
      })
      .then(
        (user: any) => sendResponse(res, err, user)
      );
  });

  /**
   * Deactivates user account
   */
  app.delete("/api/user/:userId", isLoggedIn, (req, res) => {
      req
      .models
      .user
      .update({
        status: "15"
      }, {
        where: {
          id: req.user.id
        }
      })
      .then(
        () => req.models.user.destroy({
          where: {
              id: req.user.id
          }
        })
      ).then(() => {
        return sendResponse(res, null, {});
      }, 
      (err: any) => sendResponse(res, err)
      );
  });
};
