var async = require("async");
var AuthService = require("../services/AuthService.js");

import { VQ } from "../../../core/interfaces";

const loginWithPassword = (models: any, email: string, password: string, callback: VQ.StandardCallback) => {
	if (!email || !password) {
		return callback({
      httpCode: 400,
      code: "INITIAL_PARAMS",
      message: `${!email ? "No email provided. " : ""}${!password ? "No password provided.": ""}`
    });
	}

  var User = {}, Token;

	if (password) {
		User.password = AuthService.generateHashSync(password);
	}

  async.waterfall([
    callback => {
        AuthService.getUserIdFromEmail(models, email, (err, rUser) => {
          if (err) {
            return callback(err);
          }

          if (!rUser) {
            return callback({
              status:400,
              code:"EMAIL_NOT_FOUND"
            });  
          }
          
          User = rUser.dataValues;

          return callback();
        });
    },
    callback => {
      AuthService
      .checkPassword(models, User.userId, password, (err, checkResult) => {
        if (err) {
          return callback(err);
        }

        if (!checkResult) {
          return callback({
            status: 400,
            code: "WRONG_PASSWORD"
          });
        }
        
        return callback();
      });
    }, callback => {
      AuthService.createNewToken(models, User.userId, (err, rToken) => {
        if (err) {
          return callback(err);
        }

        Token = rToken;

        return callback();
      });
    }
  ], err => callback(err, Token));
};

module.exports = {
	loginWithPassword
};

