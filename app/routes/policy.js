var randtoken = require('rand-token');
const moment = require("moment");
const async = require("async");
const cust = require("../config/customizing.js");
const models = require("../models/models.js");
const emailService = require("../services/emailService.js");
const cryptoService = require("../services/cryptoService");
const NewsletterService = require("../services/NewsletterService.js");
const responseController = require("../controllers/responseController.js");
const sendResponse = responseController.sendResponse;
const vqAuth = require("../config/vqAuthProvider");
const userEmitter = require("../events/user");
const CryptoJS = require("crypto-js");
const config = require("../config/configProvider.js")();

const validateEmail = email => { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
	return re.test(email);
};

module.exports = app => {
	var isLoggedIn = responseController.isLoggedIn;
	
	app.post("/api/signup/email", (req, res) => {
		const email = req.body.email;
		const password = req.body.password;
		const userData = {};
		
		if (!validateEmail(email)) {
			return responseController
			.sendResponse(res, {
				httpCode: 400,
				code: 'EMAIL_WRONGLY_FORMATTED',
				desc: 'Email wrongly formatted'
			});
		}

		const propertiesToBeExcluded = [ 'email', 'password', 'repeatPassword' ];

		Object.keys(req.body)
			.filter(prop => propertiesToBeExcluded.indexOf(prop) === -1)
			.forEach(prop => {
				userData[prop] = req.body[prop];
			});
		
		var vqUserId, vqAuthUser, user;

		async
			.waterfall([
				cb => {
					return vqAuth
						.localSignup(email, password, (err, rUser) => {
							if (err) {
								return cb(err);
							}

							vqAuthUser = rUser;
							vqUserId = rUser.userId;

							return cb();
						});
				},
				cb => models.user
					.create({
						accountType: 'PRIVATE',
						vqUserId,
						firstName: userData.firstName,
						lastName: userData.lastName,
						userType: userData.userType || 0
					})
					.then(rUser => {
						user = rUser;

						return cb();
					}, cb),
				cb => async
				.each(
					Object.keys(userData),
					(prop, cb) =>
						models.userProperty
						.create({
							propKey: prop,
							propValue: userData[prop],
							userId: user.id
						})
						.then(rUser => cb()),
					cb
				)
			], err => {
				if (err) {
					return responseController
						.sendResponse(res, err);
				}

				const responseData = vqAuthUser;

				responseData.user = user;

				responseController
					.sendResponse(res, err, vqAuthUser);

				const emittedUser = JSON.parse(JSON.stringify(user));

				emittedUser.emails = [ email ];
				userEmitter.emit('created', emittedUser);
			});
		});

	app.post("/api/auth/reset-password", (req, res) => {
		const code = req.body.code;
		const newPassword = req.body.newPassword;
		const repeatNewPassword = req.body.repeatNewPassword;

		if (newPassword !== repeatNewPassword) {
			return sendResponse(res, { code: 'PASSWORDS_DO_NOT_MATCH' });
		}

		vqAuth
		.resetPassword(code, newPassword, err =>
			sendResponse(res, err, { ok: true })
		);
	});

	app.post("/api/auth/request-password-reset", (req, res) => {
		const email = req.body.email;

		vqAuth
		.requestPasswordReset(email, (err, rUserResetCode) => {
			if (err) {
				console.error(err);

				return sendResponse(res, err);
			}

			const resetCode = rUserResetCode.code;
			const urlBase = config.domain || 'http://localhost:3000';

			const ACTION_URL = 
			`${urlBase}/app/change-password?code=${resetCode}`;

			emailService
				.getEmailAndSend(emailService.EMAILS.PASSWORD_RESET, email, ACTION_URL);

			return sendResponse(res, err, {});
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
					return models.user
						.findById(userId)
						.then(rUser => {
							user = rUser;
							vqUserId = user.vqUserId;
						
							cb();
						}, cb);
				}

				vqAuth
				.getAuthUserIdFromEmail(email, (err, rUserEmail) => {
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
				.getEmailsFromUserId(vqUserId, (err, rUserEmails) => {
					if (err) {
						return cb(err);
					}

					vqUserId = rUserEmails[0].userId;
					emails = rUserEmails.map(_ => _.email);
				
					models.user
						.findOne({
							vqUserId: vqUserId
						})
						.then(rUser => {
							user = rUser;

							cb();
						}, cb);
				});
			}], err => {
				const VERIFICATION_TOKEN = cryptoService.encodeObj({
					id: userId
				});
				
				const VERIFICATION_LINK = 
					`${config.serverUrl || 'http://localhost:8080'}/api/verify/email?code=${VERIFICATION_TOKEN}`;
				
				return emailService
					.sendWelcome({
						emails
					}, VERIFICATION_LINK);
			});
	});

	app.get("/api/verify/email", (req, res) => {
		var encryptedToken = req.query.code;
		var user;

		try {
			encryptedToken = encryptedToken.split(' ').join('+');
			
			user = cryptoService.decodeObj(encryptedToken);
		} catch(err) {
			return res.status(400).send({
				err: 'Could not verify'
			});
		}
		
		models
		.user
		.update({
			status: models.user.USER_STATUS.VERIFIED
		}, {
			where: {
				id: user.id
			}
		});

		models
		.appConfig
		.findOne({
			where: {
				fieldKey: 'DOMAIN'
			}
		})
		.then(configField => {
			if (configField) {
				return res.redirect(configField.fieldValue);
			}
			
			return res.redirect('https://vq-labs.com');
		});
	});
	
	app.post('/api/login', (req, res) => {
		var User;
		var email = req.body.email;
		var password = req.body.password;

		async.waterfall([
			cb => {
				vqAuth
				.localLogin(email, password, (err, rUserToken) => {
					if (err) {
						return cb(err);
					}

					User = rUserToken;

					return cb();
				});
			},
			cb => models.user.findOne({
				where: {
					vqUserId: User.userId
				},
				include: {
					model: models.userProperty
				}
			})
			.then(rUser => {
				User.user = rUser ? rUser.dataValues : null;

				if (rUser.status == '20') {
					return cb(cust.errorCodes.USER_BLOCKED);
				}

				if (rUser.status !== models.user.USER_STATUS.VERIFIED) {
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

	app.post('/api/auth/password', (req, res) => {
		var currentPassword = req.body.currentPassword;
		var newPassword = req.body.newPassword;
		var token = req.auth.token;

		vqAuth
		.changePassword(token, currentPassword, newPassword, err => {
			return responseController.sendResponse(res, err, { ok: true });
		});
	});

	app.post('/api/logout', (req, res) => {
		// @todo destroy token!
		res.status(200).send();
	});
};