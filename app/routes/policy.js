var randtoken = require('rand-token');
const moment = require("moment");
const async = require("async");
const cust = require("../config/customizing.js");
const emailService = require("../services/emailService.js");
const cryptoService = require("../services/cryptoService");
const responseController = require("../controllers/responseController.js");
const sendResponse = responseController.sendResponse;
const vqAuth = require("../auth");
const userEmitter = require("../events/user");
const CryptoJS = require("crypto-js");
const config = require("../config/configProvider.js")();

const validateEmail = email => { 
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
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
		var shouldBeAdmin = false;

		async
			.waterfall([
				cb => {
					return vqAuth
						.localSignup(req.models, email, password, (err, rUser) => {
							if (err) {
								return cb(err);
							}

							vqAuthUser = rUser;
							vqUserId = rUser.userId;

							return cb();
						});
				},
				cb => req.models.user
				.count({})
				.then(count => {
					shouldBeAdmin = !Boolean(count);

					return cb();
				}, cb),
				cb => req.models.user
					.create({
						accountType: 'PRIVATE',
						vqUserId,
						isAdmin: shouldBeAdmin,
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
						req.models.userProperty
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
				userEmitter.emit('created', req.models, emittedUser);
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
		.resetPassword(models, code, newPassword, err =>
			sendResponse(res, err, { ok: true })
		);
	});

	app.post("/api/auth/request-password-reset", (req, res) => {
		const email = req.body.email;

		vqAuth
		.requestPasswordReset(models, email, (err, rUserResetCode) => {
			if (err) {
				console.error(err);

				return sendResponse(res, err);
			}

			const resetCode = rUserResetCode.code;

			req.models.appConfig
			.findOne({
				where: {
					fieldKey: 'DOMAIN'
				}
			})
			.then(configField => {
				configField = configField || {};
				
				const urlBase = configField.fieldValue || 'http://localhost:3000';
				
				const ACTION_URL = 
				`${urlBase}/app/change-password?code=${resetCode}`;
	
				emailService
				.getEmailAndSend(models, emailService.EMAILS.PASSWORD_RESET, email, ACTION_URL);
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
			}], err => {
				const VERIFICATION_LINK = cryptoService.buildVerificationUrl(req.models.tenantId, config.SERVER_URL, { id: userId });
				
				return emailService
					.sendWelcome(req.models, {
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
		
		req.models
		.user
		.findById(user.id)
		.then(rUser => {
			if (rUser.status === req.models.user.USER_STATUS.USER_BLOCKED) {
				return res.status(401).send({
					code: 'USER_BLOCKED'
				});
			}

			if (rUser.status !== req.models.user.USER_STATUS.VERIFIED) {
				rUser.update({
					status: req.models.user.USER_STATUS.VERIFIED
				})
				.then(_ => _, err => {
					console.error(err);
				})
			}

			req.models
			.appConfig
			.findOne({
				where: {
					fieldKey: 'DOMAIN'
				}
			})
			.then(configField => {
				if (configField) {
					if (String(rUser.userType) === '1') {
						return res.redirect(configField.fieldValue + '/app/new-listing');
					}
	
					return res.redirect(configField.fieldValue + '/app/dashboard');
				}
				
				return res.redirect('https://vq-labs.com');
			}, err => {
				res.status(400).send(err);
			});
		});
	});
	
	app.post('/api/login', (req, res) => {
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

				if (rUser.status == '20') {
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

	app.post('/api/auth/password', isLoggedIn, (req, res) => {
		var currentPassword = req.body.currentPassword;
		var newPassword = req.body.newPassword;

		vqAuth
		.changePassword(req.models, req.user.vqUserId, currentPassword, newPassword, err => {
			return responseController.sendResponse(res, err, { ok: true });
		});
	});

	app.post('/api/logout', (req, res) => {
		// @todo destroy token!
		res.status(200).send();
	});
};