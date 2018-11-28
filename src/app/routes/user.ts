const responseController = require("../controllers/responseController.js");

import * as async from "async";

import { Application } from "express";
import { VQ } from "../../core/interfaces";
import { checkUserName } from "../utils";
import * as userCtrl from "../controllers/userCtrl";

const BITBOXSDK = require("bitbox-sdk/lib/bitbox-sdk").default;
const BITBOX = new BITBOXSDK();

const isLoggedIn = responseController.isLoggedIn;
const sendResponse = responseController.sendResponse;

export default (app: Application) => {
  app.get("/api/me", isLoggedIn, (req, res) => {
      return sendResponse(res, null, req.user);
  });

  app.get("/api/user/:userId", (req, res) => {
    req.models.user.findOne({
      where: { 
          id: req.params.userId 
      },
      include: [
        { model: req.models.userProperty },
        { model: req.models.userPreference },
        { model: req.models.userFollower }
      ]
    }).then(
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

  const prepareUsername = (username: string) => {
    return username;
  };

  /**
   * @api {put} /api/user/:userId Updates user data
   * @apiVersion 0.0.2
   * @apiGroup User
   *
   * @apiParam {String} email Users unique email.
   * @apiParam {String} firstName First name of the User.
   * @apiParam {String} lastName Last name of the User.
   * @apiParam {String} username Username.
   * @apiParam {String="0", "1", "2"} userType User type (any, customer, supplier).
   * @apiParam {Object} props User properties, fully extensible, [key: string]: string
   *
   * @apiSuccess {id} id user ID (is not the same as the account ID of the user)
   */
  app.put("/api/user/:userId", isLoggedIn, async (req, res) => {
      const mutableFields = [
        "firstName",
        "lastName",
        "bio",
        "website",
        "imageUrl",
        "username",
        "addressBCH"
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
      } catch (err) {
        return sendResponse(res, err);
      }

      let data: any;

      if (updateObj.username) {
        const wrongUserNameErr = checkUserName(updateObj.username);

        if (wrongUserNameErr) {
          return sendResponse(res, wrongUserNameErr);
        }
      }

      if (updateObj.addressBCH) {
        let validatedAddress: { isvalid: boolean };

        validatedAddress = await BITBOX.Util.validateAddress(updateObj.addressBCH);

        if (!validatedAddress.isvalid) {
          return sendResponse(res, {
            code: "WRONG_BCH_ADDRESS",
            data: validatedAddress,
            desc: "The Bitcoin Cash address is not valid.",
            httpCode: 400
          });
        }
      }

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
          const propKeys = Object.keys(props);

          if (!propKeys.length) {
            return cb();
          }

          async.eachLimit(propKeys, 5, (propKey: string, cb: VQ.StandardCallback) => {
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

/**
 * @api {post} /api/user/:userId/follow Follows user
 * @apiVersion 0.0.2
 * @apiGroup User
 *
 * @apiParam {userId} email Users ID
 */
  app.post("/api/user/:userId/follow", isLoggedIn, async (req, res) => {
    const followRow = await req.models.userFollower.findOne({
      where: {
        $and: [
          { userId: req.user.id },
          { followingId: req.params.userId }
        ]
      }
    });

    const user = await req.models.user.findById(req.params.userId);

    if (!user) {
      return res.status(400).send({ code: "NOT_FOUND" });
    }

    if (!followRow) {
      try {
        await req.models.userFollower.create({
          followingId: req.params.userId,
          userId: req.user.id
        });
      } catch (err) {
        return res.status(400).send({
          code: "COULD_NOT_CREATE"
        });
      }
    }

    return res.status(200).send({ code: "FOLLOWED" });
  });

/**
 * @api {post} /api/user/:userId/unfollow Unfollows user
 * @apiVersion 0.0.2
 * @apiGroup User
 *
 * @apiParam {userId} email Users ID
 */
  app.post("/api/user/:userId/unfollow", isLoggedIn, async (req, res) => {
    await req.models.userFollower.destroy({
      where: {
        $and: [
          { userId: req.user.id },
          { followingId: req.params.userId }
        ]
      }
    });

    return res.send({ code: "UNFOLLOWED" });
  });

/**
 * @api {get} /api/user/:userId/followers Gets user followers
 * @apiVersion 0.0.2
 * @apiGroup User
 *
 * @apiParam {userId} Users ID
 */
  app.get("/api/user/:userId/followers", async (req, res) => {
    const followerData = await req.models.userFollower.findAll({
      where: {
        $and: [
          { followingId: req.params.userId }
        ]
      }
    });

    const ids = followerData.map(_ => {
      return {
        id: _.userId
      };
    });

    const users = await req.models.user.findAll({
      where: {
        $or: ids
      }
    });

    return res.status(200).send(users);
  });

/**
 * @api {get} /api/user/:userId/following Gets following users
 * @apiVersion 0.0.2
 * @apiGroup User
 *
 * @apiParam {userId} Users ID
 */
  app.get("/api/user/:userId/following", async (req, res) => {
    const followingUsers = await req.models.userFollower.findAll({
      where: {
        $and: [
          { userId: req.params.userId },
        ]
      }
    });

    const ids = followingUsers.map(_ => {
      return { id: _.followingId };
    });

    const users = await req.models.user.findAll({
      where: {
          $or: ids
      }
    });

    return res.status(200).send(users);
  });
};
