const jwt = require("jsonwebtoken");
const cust = require("../config/customizing");
const randomstring = require("randomstring");
const models = require("../models/models");
const vqAuth = require("../auth");

export const isAuth = (req) => {
	if (req.headers["x-auth-token"]) {
		try {
			let secret = process.env.SECRET || randomstring.generate(64);
			let decoded = jwt.verify(req.headers["x-auth-token"], secret);

			return decoded;
		} catch (err) {
			console.log(err);

			return false;
		}
	} else {
		return false;
	}
};

function parseUserFactory (loginRequired: boolean, adminRequired: boolean, requiredStatus: "10") {
	return (req, res, next) => {
			const authToken = req.headers["x-auth-token"];

			vqAuth
			.checkToken(req.models, authToken, (err, rAuthUser) => {
				if (err) {
					if (loginRequired || adminRequired) {
						return res.status(cust.errorCodes.NOT_AUTHENTIFICATIED.httpCode)
							.send(cust.errorCodes.NOT_AUTHENTIFICATIED);
					}

					return next();
				}

				if (rAuthUser) {
					req.models.user
					.findOne({ 
						where: {
							vqUserId: rAuthUser.userId
						},
						include: [
							{ model: req.models.userProperty },
							{ model: req.models.userPreference }
						]
					})
					.then(user => {
						if (!user) {
							return res.status(cust.errorCodes.NOT_AUTHENTIFICATIED.httpCode)
								.send(cust.errorCodes.NOT_AUTHENTIFICATIED);
						}

						if (user.status == "20") {
							return res.status(cust.errorCodes.USER_BLOCKED.httpCode)
								.send(cust.errorCodes.USER_BLOCKED);
						}

						if (requiredStatus && user.status !== requiredStatus) {
							return res.status(cust.errorCodes.NO_RIGHTS.httpCode)
								.send(cust.errorCodes.NO_RIGHTS);
						}

						req.user = user.dataValues;

						if (adminRequired && !req.user.isAdmin) {
							return res.status(cust.errorCodes.NOT_AUTHENTIFICATIED.httpCode)
								.send(cust.errorCodes.NOT_AUTHENTIFICATIED);
						}

						return next();
					}, err => {
						if (err) {
							return res.status(cust.errorCodes.DATABASE_ERROR.httpCode)
							.send(cust.errorCodes.DATABASE_ERROR);
						}
					});
				} else {
					if (loginRequired || adminRequired) {
						return res.status(cust.errorCodes.NOT_AUTHENTIFICATIED.httpCode)
							.send(cust.errorCodes.NOT_AUTHENTIFICATIED);
					}

					return next();
				}
			});
		};
}

export const isLoggedIn = parseUserFactory(true, false);
export const isLoggedInAndVerified = parseUserFactory(true, false, "10");
export const isAdmin = parseUserFactory(true, true);
export const identifyUser = parseUserFactory(false, false);

export const hasValidSubscription = (req, res, next) => {
	return next();
};

export const sendResponse = (res, err, data) => {
	if (err) {
		console.error(err);

		if (typeof err === "string") {
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
};

export const sendError = (res, errCode, error) => {
	var err = cust.errorCodes[errCode];

	if (err) {
		err.data = error;
		return res.status(err.httpCode).send(err);
	}

	console.log("[UNKNOWN ERROR CODE]", errCode);
	return res.status(500).send(cust.errorCodes.UNKNOWN_ERROR);
};

export const generateError = (errCode, data) => {
	let errorObj = cust.errorCodes[errCode];

	if (errorObj) {
		return {status:errorObj.httpCode, code: errorObj.code, message:errorObj.desc, data:data };
	}

	errorObj = cust.errorCodes.UNKNOWN_ERROR;

	return { status:errorObj.httpCode, code: errorObj.code, message:errorObj.desc, data:data };
};
