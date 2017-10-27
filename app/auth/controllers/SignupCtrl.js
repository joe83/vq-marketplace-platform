var async = require("async");
var AuthService = require("../services/AuthService.js");

const createLocalAccount = (models, email, password, callback) => {
  if (!email || !password) {
    return callback({
      status: 400,
      code: "INITIAL_PARAMS"
    });
  }
  
  var newUser = {};

	if (password) {
		newUser.password = AuthService.generateHashSync(password);
	}
	
  async.waterfall([
    callback => AuthService.createNewUser(models, (err, rNewUser) => {
        if (err) {
          return callback(err);
        }

        newUser = rNewUser;
        
        return callback();
    }),
    callback => AuthService.createNewEmail(models, newUser.id, email, callback),
    callback => AuthService.createNewPassword(models, newUser.id, password, callback),
    callback => AuthService.createNewToken(models, newUser.id, callback)
  ], (err, rUserToken) => {
    if (err) {
      console.error(err);
    }

    callback(err, rUserToken);
  });
};

module.exports = {
	createLocalAccount: createLocalAccount,
};