"use strict";

const EventEmitter = require("events");
const async = require("async");
const emailService = require("../services/emailService.js");
const vqAuth = require("../auth");

class DefaultEmitter extends EventEmitter {}

const requestEmitter = new DefaultEmitter();

const getOrderFromRequest = (models, requestId, cb) => {
    models.order
        .findOne({
            where: {
                requestId
            }
        })
        .then(order => {
            return cb(null, order);
        }, cb);
};

const getRequestOwnerEmails = (models, requestId, cb) => {
    let emails, request, order, task;

    return async.waterfall([
        cb => models
            .request
            .findOne({
                where: {
                    id: requestId
                },
                include: [
					{ model: models.user, as: "fromUser" },
					{ model: models.task, as: "task" }
                ]
            })
            .then(rRequest => {
				if (!rRequest) {
					return cb({ code: "REQUEST_NOT_FOUND", requestId });
				}

				request = rRequest;
				task = rRequest.task;

                return cb();
			}, cb),
		cb => {
			getOrderFromRequest(models, requestId, (err, rOrder) => {
				if (err) {
					return cb(err);
				}

				order = rOrder;

				return cb();
			});
		},
        cb => vqAuth
            .getEmailsFromUserId(models, request.fromUser.vqUserId, (err, rUserEmails) => {
                if (err) {
                    return cb(err);
                }

                emails = rUserEmails
                    .map(_ => _.email);

                cb();
            })
        ], err => {
            cb(err, {
				request,
				order,
				task,
                emails
            });
        });
};

const requestEventHandlerFactory = (emailCode, actionUrlFn) => {
	return (models, requestId) => {
		var request, order, task;
		var emails;
		var emailData = {};

		async.waterfall([
			cb => getRequestOwnerEmails(models, requestId, (err, data) => {
                if (err) {
                    return cb(err);
                }

                emails = data.emails;
                order = data.order;
				request = data.request;
				task = data.task;

				return cb();
            }),
			cb => models
				.appConfig
				.findOne({
					where: {
						fieldKey: "DOMAIN"
					}
				})
				.then(configField => {
					configField = configField || {};
					
					const domain = configField.fieldValue || "http://localhost:3000";

					emailData.ACTION_URL = 
						actionUrlFn(domain, requestId, order ? order.id : undefined);

					emailData.LISTING_TITLE = task.title;

					cb();
				}, cb)
		], err => {
			if (err) {
				return console.error(err);
			}

			// its handled by other events already
			if (emailCode === "request-completed") {
				return;
			}

			// supply listings, we ignore it, clean it up with the new approach!
			if (
				(
					emailCode === "request-closed" ||
					emailCode === "request-declined" ||
					emailCode === "request-cancelled" ||
					emailCode === "task-request-cancelled"
				)
				&& Number(task.taskType) === 2) {
				return;
			}

			emailService
			.checkIfShouldSendEmail(models, emailCode, request.userId, () =>
				emailService.getEmailAndSend(models, emailCode, emails, emailData)
			);
		});
	};
};

requestEmitter
	.on("message-received", (models, messageId) => {
			let message;

			const emailData = {};

			async.waterfall([
				cb => models.message.findOne({
					where: {
						id: messageId
					},
					include: [
						{ model: models.task },
						{ model: models.user, as: "toUser" },
						{ model: models.user, as: "fromUser" }
					]
				})
				.then(rMessage => {
					message = rMessage;
					
					emailData.SENDER_FIRST_NAME = message.fromUser.firstName;
					emailData.SENDER_LAST_NAME = message.fromUser.lastName;
					emailData.LISTING_TITLE = message.task.title;

					cb();
				}, cb),
				cb => {
					vqAuth
					.getEmailsFromUserId(models, message.toUser.vqUserId, (err, rUserEmails) => {
						if (err) {
							return cb(err);
						}
		
						const emails = rUserEmails
							.map(_ => _.email);
		
							models
							.appConfig
							.findOne({
								where: {
									fieldKey: "DOMAIN"
								}
							})
							.then(configField => {
								configField = configField || {};
								
								const domain = configField.fieldValue || "http://localhost:3000";
			
								const ACTION_URL = `${domain}/app/chat/${message.requestId}`;
			
								emailData.ACTION_URL = ACTION_URL;

								emailService
								.checkIfShouldSendEmail(models, "message-received", message.toUser.id, () =>
									emailService
									.getEmailAndSend(models, "message-received", emails[0], emailData)
								);
							}, cb);
					});
				}
			], err => {
				if (err) {
					console.error(err);
				}
			});
	});

requestEmitter
	.on("request-accepted", 
		requestEventHandlerFactory("request-accepted", (domain, requestId) =>
			`${domain}/app/chat/${requestId}`
		)
	);

requestEmitter
	.on("request-completed", 
		requestEventHandlerFactory("request-completed", (domain, requestId) =>
			`${domain}/app/request/${requestId}/review`
		)
	);

requestEmitter
	.on("closed",
		requestEventHandlerFactory("request-closed", (domain, requestId, orderId) =>
			`${domain}/app/request/${requestId}/review`
		)
	);

requestEmitter
	.on("request-declined",
	requestEventHandlerFactory("request-declined", (domain, requestId) => 
		`${domain}/app`
	)
);

requestEmitter
	.on("request-cancelled",
		requestEventHandlerFactory("request-cancelled", (domain, requestId) =>
			`${domain}/app`
		)
	);

requestEmitter
	.on("request-marked-as-done",
		requestEventHandlerFactory("request-marked-as-done",
			(domain) => `${domain}/app/dashboard`
		)
	);

requestEmitter
	.on("new-request", (models, requestId) => {
		var request;
		var requestSentEmails;
		var requestReceivedEmails;
		var ACTION_URL;

		async.waterfall([
			cb => models
				.request
				.findOne({
					where: {
						id: requestId
					},
					include: [
						{ model: models.task },
						{ model: models.user, as: "fromUser" },
						{ model: models.user, as: "toUser" }
					]
				})
				.then(rRequest => {
					request = rRequest;

					/**
					 * We do not send emails for supply listings.
					 */
					if (Number(request.task.taskType) === 2) {
						return cb({
							skip: true
						});
					}

					return cb();
				}, cb),
			cb => vqAuth
				.getEmailsFromUserId(models, request.fromUser.vqUserId, (err, rUserEmails) => {
					if (err) {
						return cb(err);
					}

					requestSentEmails = rUserEmails
						.map(_ => _.email);

					cb();
				}),
			cb => vqAuth
				.getEmailsFromUserId(models, request.toUser.vqUserId, (err, rUserEmails) => {
					if (err) {
						return cb(err);
					}

					requestReceivedEmails = rUserEmails
						.map(_ => _.email);
					
					cb();
				}),
			cb => models
				.appConfig
				.findOne({
					where: {
						fieldKey: "DOMAIN"
					}
				})
				.then(configField => {
					configField = configField || {};
					
					const domain = configField.fieldValue || "http://localhost:3000";

					ACTION_URL = 
						`${domain}/app/chat/${requestId}`;

					cb();
				}, cb)
		], err => {
			if (err) {
				if (err.skip) {
					return;
				}

				return console.error(err);
			}

			if (requestReceivedEmails) {
				emailService
				.checkIfShouldSendEmail(models, emailService.EMAILS.REQUEST_RECEIVED, request.toUser.id, () =>
					emailService
					.getEmailAndSend(models, emailService.EMAILS.REQUEST_RECEIVED, requestReceivedEmails, {
						ACTION_URL,
						LISTING_TITLE: request.task.title
					})
				);
			}
			
			if (requestSentEmails) {
				emailService
				.checkIfShouldSendEmail(models, emailService.EMAILS.REQUEST_SENT, request.fromUser.id, () =>
					emailService
					.getEmailAndSend(models, emailService.EMAILS.REQUEST_SENT, requestSentEmails, {
						ACTION_URL,
						LISTING_TITLE: request.task.title
					})
				);
			}
		});
	});

module.exports = requestEmitter;
