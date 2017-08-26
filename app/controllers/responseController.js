var jwt = require('jsonwebtoken');
var cust = require("../config/customizing.js");
var superSecret = require("../config/configProvider.js")().secret;
var models = require("../models/models.js");
const vqAuth = require("../config/vqAuthProvider");

function isAuth(req) {
	if (req.headers['x-auth-token']) {
		try {
			var decoded = jwt.verify(req.headers['x-auth-token'], superSecret);

			return decoded;
		} catch (err) {
			console.log(err);
			
			return false;
		}
	} else {
		return false;
	}
}

function parseUserFactory (loginRequired, adminRequired, requiredStatus) {
	return (req, res, next) => new Promise((resolve, reject) => {
			const authToken = req.headers['x-auth-token'];

			vqAuth
			.checkToken(authToken, (err, rAuthUser) => {
				if (err) {
					if (loginRequired || adminRequired) {
						res.status(cust.errorCodes.NOT_AUTHENTIFICATIED.httpCode)
							.send(cust.errorCodes.NOT_AUTHENTIFICATIED);

						return reject(cust.errorCodes.NOT_AUTHENTIFICATIED.httpCode);
					}
					
					return next();	
				}

				if (rAuthUser) {
					models.user
					.findOne({ 
						where: {
							vqUserId: rAuthUser.userId
						},
						include: [
							{ model: models.userProperty }
						]
					})
					.then(user => {
						if (!user) {
							res.status(cust.errorCodes.NOT_AUTHENTIFICATIED.httpCode)
							.send(cust.errorCodes.NOT_AUTHENTIFICATIED);
						
							return reject(cust.errorCodes.NOT_AUTHENTIFICATIED.httpCode);
						}

						if (user.status == '20') {
							res.status(cust.errorCodes.USER_BLOCKED.httpCode)
							.send(cust.errorCodes.USER_BLOCKED);
					
							return reject(cust.errorCodes.USER_BLOCKED.httpCode);
						}

						if (requiredStatus && user.status !== requiredStatus) {
							res.status(cust.errorCodes.NO_RIGHTS.httpCode)
							.send(cust.errorCodes.NO_RIGHTS);
					
							return reject(cust.errorCodes.NO_RIGHTS.httpCode);
						}

						req.user = user.dataValues;

						if (adminRequired && !req.user.isAdmin) {
							res.status(cust.errorCodes.NOT_AUTHENTIFICATIED.httpCode)
							.send(cust.errorCodes.NOT_AUTHENTIFICATIED);
					
							return reject(cust.errorCodes.NOT_AUTHENTIFICATIED.httpCode);
						}

						return next ? next() : resolve();
					}, err => {
						if (err) {
							res.status(cust.errorCodes.DATABASE_ERROR.httpCode)
							.send(cust.errorCodes.DATABASE_ERROR);
		
							return reject(cust.errorCodes.DATABASE_ERROR.httpCode);
						}
					});
				} else {
					if (loginRequired || adminRequired) {
						res.status(cust.errorCodes.NOT_AUTHENTIFICATIED.httpCode).send(cust.errorCodes.NOT_AUTHENTIFICATIED);
						
						return reject(cust.errorCodes.NOT_AUTHENTIFICATIED.httpCode);
					}
					
					return next ? next() : resolve();
				}
			});
		});
}

const isLoggedIn = parseUserFactory(true, false);
const isLoggedInAndVerified = parseUserFactory(true, false, '10');
const isAdmin = parseUserFactory(true, true);
const identifyUser = parseUserFactory(false, false);

module.exports = {
	isAdmin,
	isLoggedIn,
	isLoggedInAndVerified,
	identifyUser,
	sendResponse: (res, err, data) => {
		if (err) {
			console.error(err);
			
			if (typeof err === 'string') {
				return res.status(400).send(err);
			}

			if (err.httpCode) {
				return res.status(err.httpCode).send(err);
			}

			if (err.code) {
				return res.status(400).send(err);
			}
			
			if (err.status) {
				err.data = data;
				
				return res.status(err.status).send(err);
			}
				
			return res.status(500).send(err);
		}
		
		return res.status(200).send(data);
	},
	sendError: (res, errCode, error) => {
		var err = cust.errorCodes[errCode];

		if (err) {
			err.data = error;
			return res.status(err.httpCode).send(err);
		}

		console.log("[UNKNOWN ERROR CODE]", errCode);
		return res.status(500).send(cust.errorCodes.UNKNOWN_ERROR);
	},
	generateError : (errCode, data) => {
		var errorObj = cust.errorCodes[errCode];
		if (errorObj) {
			return {status:errorObj.httpCode, code: errorObj.code, message:errorObj.desc, data:data };
		}

		errorObj = cust.errorCodes.UNKNOWN_ERROR;

		return { status:errorObj.httpCode, code: errorObj.code, message:errorObj.desc, data:data };
	},
	isAuth : isAuth
};
