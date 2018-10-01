var async = require("async");
var AuthService = require("../services/AuthService.js");
import * as Sequelize from "sequelize";
import { VQ } from "../../../core/interfaces";

export const createLocalAccount = (models: Sequelize.Models, email: string, password: string, callback: VQ.StandardCallback) => {
  if (!email) {
    return callback({
      httpCode: 400,
      code: "INITIAL_EMAIL"
    });
  }

  if (!password) {
    return callback({
      httpCode: 400,
      code: "INITIAL_PASSWORD"
    });
  }

  let newUser: object;
  let userToken: string;

  async.waterfall([
    (callback: VQ.StandardCallback) => AuthService.createNewUser(models, (err: VQ.APIError, rNewUser: any) => {
        if (err) {
          return callback(err);
        }

        newUser = rNewUser;

        return callback();
    }),
    (callback: VQ.StandardCallback) => AuthService.createNewEmail(models, newUser.id, email, callback),
    (callback: VQ.StandardCallback) => AuthService.createNewPassword(models, newUser.id, password, callback),
    (callback: VQ.StandardCallback) => AuthService.createNewToken(models, newUser.id, (err, rUserToken) => {
      if (err) {
        console.error(err);
  
        return callback(err);
      }

      userToken = rUserToken;

      return callback();
    })
  ], (err: VQ.APIError) => {
    if (err) {
      console.error(err);

      return callback(err);
    }

    console.log(`[${models.tenantId}] Auth Data created`);

    return callback(err, userToken);
  });
};
