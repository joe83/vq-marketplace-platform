const async = require("async");
const cust = require("../config/customizing.js");

const cryptoService = require("../services/cryptoService");

import { Application } from "express";
import { IVQRequest } from "../interfaces";

import * as authCtrl from "../controllers/authCtrl";

import * as emailService from "../services/emailService.js";

import * as vqAuth from "../auth";

import { isLoggedIn, sendResponse } from "../controllers/responseController.js";

export default (app: Application) => {
	/**
	 * @api {get} /api/signup/email Signup
	 * @apiVersion 0.0.2
	 * @apiGroup User
	 * @apiDescription
     * API endpoint for signup of new users with e-mail. It supports JWT authentification. In the response you will get a token, that you can then include in subsequent requests in the "x-auth-token".
	 * @apiParam {String} email Users unique email.
	 * @apiParam {String} password User password
	 * @apiParam {String} repeatPassword Repeated user password for verification
	 * @apiParam {String} firstName First name of the User.
	 * @apiParam {String} firstName Last name of the User.
	 * @apiParam {String="0", "1", "2"} userType User type (any, customer, supplier).
	 * @apiParam {Object} props User properties, fully extensible, [key: string]: string
	 * @apiExample {js} Example request
	fetch('/api/signup/email', {
		method: 'POST',
		body: {
			email: "info@vq-labs.com",
			password: "test",
			firstName: "Max",
			lastName: "Mustermann",
			userType: 1, // 1 stands for demand users, 2 for supply users
			props: { // any property can be added to user
				propOne: "one",
				propTwo: "two"
			}
		}
	})
	.then(response => response.json())
	.then(response => console.log('Success:', JSON.stringify(response)))
	.catch(error => console.error('Error:', error));
	 * @apiSuccess {number} id Account ID (is not the same as the ID of the user!)
	 * @apiSuccess {String} token Authentification token can be saved for next requests
	 * @apiSuccess {User} user User object
	 * @apiSuccessExample {json} Success-Response
     * {
	 // Save this token and include it in the header "x-auth-token" in the subsequent requests.
	 token: "X-AUTH_TOKEN",
	 user: {
		id: 16
		userType: 2,
		status: "0",
		accountType: "PRIVATE"
		avgReviewRate: 3
		billingAddresses: []
		bio: null
		country: null
		createdAt: "2018-10-07T18:41:05.000Z"
		deletedAt: null
		firstName: "Max"
		lastName: "Mustermann"
		imageUrl: null
		isAdmin: false
		reviews: []
		updatedAt: "2018-10-07T18:41:05.000Z"
		userPreferences: []
		userProperties: [
			{ id: 69, propKey: "companyName", propValue: "VQ", createdAt: "2018-10-07T18:41:05.000Z", updatedAt: "2018-10-07T18:41:05.000Z" }
			{ id: 71, propKey: "phoneNo", propValue: "123123", createdAt: "2018-10-07T18:41:05.000Z", updatedAt: "2018-10-07T18:41:05.000Z" }
			{ id: 73, propKey: "termsOfSeriviceAccepted", propValue: "1", createdAt: "2018-10-07T18:41:05.000Z", updatedAt: "2018-10-07T18:41:05.000Z" }
			{ id: 75, propKey: "privacyPolicyAccepted", propValue: "1", createdAt: "2018-10-07T18:41:05.000Z", updatedAt: "2018-10-07T18:41:05.000Z" }
		],
		vqUserId: 33,
		// authentification object:
		vqUser: {
			createdAt: "2018-10-07T18:41:04.000Z"
			id: 33
			status: 0
			updatedAt: "2018-10-07T18:41:04.000Z"
		}
		website: null
	}
	 */

	app.post("/api/signup/email", (req: IVQRequest, res) =>
		authCtrl.createNewAccount(req.models, req.body, (err, responseData) =>
			sendResponse(res, err, responseData)
		));

	app.post("/api/auth/reset-password", (req: IVQRequest, res) => {
		const code = req.body.code;
		const newPassword = req.body.newPassword;
		const repeatNewPassword = req.body.repeatNewPassword;

		if (newPassword !== repeatNewPassword) {
			return sendResponse(res, { code: "PASSWORDS_DO_NOT_MATCH" }, undefined);
		}

		vqAuth.resetPassword(req.models, code, newPassword, (err: any) =>
			sendResponse(res, err, { ok: true })
		);
	});

	app.post("/api/auth/request-password-reset", async (req: IVQRequest, res) => {
		const email = req.body.email;
		let rUserResetCode: any;

		try {
			rUserResetCode = await vqAuth.requestPasswordReset(req.models, email);
		} catch (err) {
			return res.status(400).send(err);
		}

		const resetCode = rUserResetCode.code;

		let configField = await req.models.appConfig
			.findOne({
				where: {
					fieldKey: "DOMAIN"
				}
			});

		configField = configField || {};

		const urlBase = configField.fieldValue || "http://localhost:3000";

		const ACTION_URL = `${urlBase}/login?code=${resetCode}`;

		emailService.getEmailAndSend(req.models, emailService.EMAILS.PASSWORD_RESET, [ email ], { ACTION_URL });

		sendResponse(res, undefined, {});
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
				.getEmailsFromUserId(req.models, vqUserId, (err, _emails) => {
					if (err) {
						return cb(err);
					}

					vqUserId = rUserEmails[0].userId;
					emails = _emails;

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
					.buildVerificationUrl(req.models.tenantId, { id: userId });

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
			res.status(400);
			res.send(new Buffer("<p>Could not verify</p>"));

			return;
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

				return res.send(new Buffer(
					`<p>This verification link is no longer valid.<span style="display:none;">${err.code}</span></p>`
				));
			}

			if (!configField) {
				res.set("Content-Type", "text/html");

				return res.send(new Buffer("<p>Missing configuration. Configure DOMAIN.</p>"));
			}

			if (process.env.ENV.toLowerCase() !== 'production') {
				return res.send({
					ok: true
				});
			}

			return res.redirect(configField.fieldValue + "/thank-you");
		});
	});

	app.post("/api/login", (req, res) => {
		let User;
		let email = req.body.email;
		let password = req.body.password;

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

				if (rUser.status !== "11") {
					let  message = "The access the the platform is currently limited. ";

					message += "Your account has not been activated. Tweet us at @HonestCash for a personal invitation.";

					return cb({
						code: "NOT_ACTIVATED",
						desc: message,
						httpCode: 400
					});
				}

				if (rUser.status !== req.models.user.USER_STATUS.VERIFIED && rUser.status !== "11") {
					return cb({
						code: "USER_NOT_VERIFIED",
						esc: "Your e-mail has not been confirmed.",
						httpCode: 400
					});
				}

				return cb();
			}, cb)
		], err => 
			sendResponse(res, err, User));
	});

	app.post("/api/auth/password", isLoggedIn, (req, res) => {
		var currentPassword = req.body.currentPassword;
		var newPassword = req.body.newPassword;

		vqAuth
		.changePassword(req.models, req.user.vqUserId, currentPassword, newPassword, err => {
			return sendResponse(res, err, { ok: true });
		});
	});

	app.post("/api/logout", isLoggedIn, (req, res) => {
		req.models.userToken.destroy({
			where: {
				$and: [
					{ token: req.auth.token }
				]
			}
		});

		res.status(200).send();
	});
};