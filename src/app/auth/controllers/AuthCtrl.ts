const async = require("async");

import * as AuthService from "../services/AuthService";

const checkToken = (models, token: String, callback) => {
	if (!token) {
		return callback({
      status: 400,
      code: "NO_TOKEN",
      message: "Token is missing."
    });
	}

  async.waterfall([
        callback => AuthService.checkToken(models, token, (err, rUserToken) => {
          if (err) {
            return callback(err);
          }
          
          if (!rUserToken) {
            return callback({
              status: 400, 
              code: "WRONG_TOKEN"
            });  
          }

          if (rUserToken.deleted) {
            return callback({
              status: 400, 
              code: "INVALID_TOKEN"
            });
          }

          return callback(null, rUserToken);
        }),
  ], (err, rUserToken) => callback(err, rUserToken));
};

const changePassword = (models, userId, newPassword) => {
  models.userPassword.destroy({
    where: [
      { userId }
    ]
  }).then(() => {
    AuthService.createNewPassword(models, userId, newPassword, () => {});
  });
};

module.exports = {
  changePassword,
  checkToken
};
