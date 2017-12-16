const async = require("async");
const cust = require("../config/customizing.js");
const emailService = require("../services/emailService.js");
const cryptoService = require("../services/cryptoService");
const responseController = require("../controllers/responseController.js");
const authCtrl = require("../controllers/authCtrl.js");
const sendResponse = responseController.sendResponse;
const vqAuth = require("../auth");
const userEmitter = require("../events/user");
const config = require("../config/configProvider.js")();

module.exports = app => {
	var isLoggedIn = responseController.isLoggedIn;
	
	app.post("/api/signup/email", (req, res) => authCtrl
		.createNewAccount(req.models, req.body, (err, responseData) =>
			responseController.sendResponse(res, err, responseData)
		));

	app.post("/api/auth/reset-password", (req, res) => {
		const code = req.body.code;
		const newPassword = req.body.newPassword;
		const repeatNewPassword = req.body.repeatNewPassword;

		if (newPassword !== repeatNewPassword) {
			return sendResponse(res, { code: "PASSWORDS_DO_NOT_MATCH" });
		}

		vqAuth
		.resetPassword(req.models, code, newPassword, err =>
			sendResponse(res, err, { ok: true })
		);
	});

	app.post("/api/auth/request-password-reset", (req, res) => {
		const email = req.body.email;

		vqAuth
		.requestPasswordReset(req.models, email, (err, rUserResetCode) => {
			if (err) {
				console.error(err);

				return sendResponse(res, err);
			}

			const resetCode = rUserResetCode.code;

			req.models.appConfig
			.findOne({
				where: {
					fieldKey: "DOMAIN"
				}
			})
			.then(configField => {
				configField = configField || {};
				
				const urlBase = configField.fieldValue || "http://localhost:3000";
				
				const ACTION_URL = 
				`${urlBase}/app/change-password?code=${resetCode}`;
	
				emailService
				.getEmailAndSend(req.models, emailService.EMAILS.PASSWORD_RESET, [ email ], ACTION_URL);
			}, err => console.error(err));
			
			sendResponse(res, err, {});
		});
	});

	app.post("/api/verify/resend-email", isLoggedIn, (req, res) => {
		var email = req.body.email;
		var userId = req.body.userId;

		var user;
		var emails;
		var vqUserId;

		async.waterfall([
			cb => {
				if (userId) {
					return req.models.user
						.findById(userId)
						.then(rUser => {
							user = rUser;
							vqUserId = user.vqUserId;
						
							cb();
						}, cb);
				}

				vqAuth
				.getAuthUserIdFromEmail(req.models, email, (err, rUserEmail) => {
					if (err) {
						return cb(err);
					}
		
					vqUserId = rUserEmail.userId;
				});
			}, 
			cb => {
				if (email) {
					return cb();
				}

				vqAuth
				.getEmailsFromUserId(req.models, vqUserId, (err, rUserEmails) => {
					if (err) {
						return cb(err);
					}

					vqUserId = rUserEmails[0].userId;
					emails = rUserEmails.map(_ => _.email);
				
					req.models.user
						.findOne({
							vqUserId: vqUserId
						})
						.then(rUser => {
							user = rUser;

							cb();
						}, cb);
				});
			}], () => {
				const VERIFICATION_LINK = cryptoService
					.buildVerificationUrl(req.models.tenantId, config.SERVER_URL, { id: userId });
				
				emailService
					.getEmailAndSend(req.models, emailService.EMAILS.WELCOME, emails, {
						VERIFICATION_LINK
					});

				res.send({
					code: "EMAIL_SENT"
				});
			});
	});

	app.get("/api/verify/email", (req, res) => {
		var encryptedToken = req.query.code;
		var user, userRef;

		try {
			encryptedToken = encryptedToken.split(" ").join("+");
			
			user = cryptoService.decodeObj(encryptedToken);
		} catch(err) {
			res.set("Content-Type", "text/html");
			res.send(new Buffer("<p>Could not verify</p>"));
		}
		
		async.waterfall([
			cb => {
				req.models
				.user
				.findById(user.id)
				.then(rUser => {
					if (rUser.status === req.models.user.USER_STATUS.USER_BLOCKED) {
						return cb({
							httpCode: 401,
							code: "USER_BLOCKED"
						});
					}

					userRef = rUser;

					cb(null, rUser);
				});
			},
			(rUser, cb) => {
				if (rUser.status && rUser.status !== req.models.user.USER_STATUS.UNVERIFIED) {
					return cb({
						httpCode: 400,
						code: "WRONG_USER_STATUS"
					});
				}

				rUser
				.update({
					status: req.models.user.USER_STATUS.VERIFIED
				})
				.then(_ => cb(), err => {
					return {
						err: err,
						httpCode: 400
					};
				});
			},
			cb => {
				req.models
				.appConfig
				.findOne({
					where: {
						fieldKey: "DOMAIN"
					}
				})
				.then(configField => {
					cb(null, configField);
				}, err => {
					return {
						err: err,
						httpCode: 400
					};
				});
			}
		], (err, configField) => {
			if (err) {
				res.set("Content-Type", "text/html");

				return res.send(new Buffer(`<p>This verification link is no longer valid.<span style="display:none;">${err.code}</span></p>`));
			}
			
			if (!configField) {
				res.set("Content-Type", "text/html");
				
				return res.send(new Buffer("<p>Missing configuration. Configure DOMAIN.</p>"));
			}

			if (userRef.userType === 1) {
				return res.redirect(configField.fieldValue + "/app/new-listing");
			}

			return res.redirect(configField.fieldValue + "/app/dashboard");
		});
	});
	
	app.post("/api/login", (req, res) => {
		var User;
		var email = req.body.email;
		var password = req.body.password;

		async.waterfall([
			cb => {
				vqAuth
				.localLogin(req.models, email, password, (err, rUserToken) => {
					if (err) {
						return cb(err);
					}

					User = rUserToken;

					return cb();
				});
			},
			cb => req.models.user
			.findOne({
				where: {
					vqUserId: User.userId
				},
				include: [
					{
						model: req.models.userProperty
					}, {
						model: req.models.userPreference
					}
				]
			})
			.then(rUser => {
				if (!rUser) {
					return cb(cust.errorCodes.USER_NOT_FOUND);
				}

				User.user = rUser ? rUser.dataValues : null;

				if (rUser.status == "20") {
					return cb(cust.errorCodes.USER_BLOCKED);
				}

				if (rUser.status !== req.models.user.USER_STATUS.VERIFIED) {
					return cb({
						token: User.token,
						user: User.user,
						err: cust.errorCodes.USER_NOT_VERIFIED
					});
				}

				return cb();
			}, cb)
		], err => 
			responseController
				.sendResponse(res, err, User));
	});

	app.post("/api/auth/password", isLoggedIn, (req, res) => {
		var currentPassword = req.body.currentPassword;
		var newPassword = req.body.newPassword;

		vqAuth
		.changePassword(req.models, req.user.vqUserId, currentPassword, newPassword, err => {
			return responseController.sendResponse(res, err, { ok: true });
		});
	});

	app.post("/api/logout", (req, res) => {
		// @todo destroy token!
		res.status(200).send();
	});
};