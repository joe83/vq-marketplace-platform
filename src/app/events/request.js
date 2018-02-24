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
	let demandEmails, supplyEmails, supplyUserId, demandUserId, request, order, task;
	const emailsTriggeredByEvent = [];

	const setEmails = (user, emails) => {
		if (user.userType === 1) {
			demandUserId = user.id;
			demandEmails = emails;
		}

		if (user.userType === 2) {
			supplyUserId = user.id
			supplyEmails = emails;
		}
	};

    return async.waterfall([
        cb => models
            .request
            .findOne({
                where: {
                    id: requestId
                },
                include: [
					{ model: models.user, as: "fromUser" },
					{ model: models.user, as: "toUser" },
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

				const emails = rUserEmails
                    .map(_ => _.email);

				setEmails(request.fromUser, emails);

                cb();
			}),
		cb => vqAuth
            .getEmailsFromUserId(models, request.toUser.vqUserId, (err, rUserEmails) => {
                if (err) {
                    return cb(err);
                }

                const emails = rUserEmails
                    .map(_ => _.email);

				setEmails(request.toUser, emails);

                cb();
            }),
			cb => {
				emailsTriggeredByEvent.push(emailService.getEventEmails(models, emailCode));
				cb();
			}
        ], err => {
            cb(err, {
				request,
				order,
				task,
				supplyEmails,
				demandEmails,
				supplyUserId,
				demandUserId
            });
        });
};

const requestEventHandlerFactory = (emailCode, actionUrlFn) => {
	return (models, requestId, emailCode) => {
		let request, order, task;
		let demandEmails, supplyEmails, supplyUserId, supplyUserType, demandUserId, demandUserType;
		var supplyListingsEnabled, demandListingsEnabled;
		let emailData = {};

		async.waterfall([
			cb => getRequestOwnerEmails(models, requestId, (err, data) => {
                if (err) {
                    return cb(err);
                }

				supplyUserId = data.supplyUserId;
				supplyUserType = data.supplyUserType;
				demandUserId = data.demandUserId;
				demandUserType = data.demandUserType;
				demandEmails = data.demandEmails;
				supplyEmails = data.supplyEmails;
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

					const ACTION_URL = actionUrlFn(domain, requestId, order ? order.id : undefined, 1);
            		const SUPPLY_ACTION_URL = actionUrlFn(domain, requestId, order ? order.id : undefined, 2);

					emailData.ACTION_URL = ACTION_URL;
					emailData.SUPPLY_ACTION_URL = SUPPLY_ACTION_URL;

					emailData.LISTING_TITLE = task.title;

					cb();
				}, cb),
			cb => models
                .appConfig
                .findAll({
                    where: {
                        $or: [
                            { fieldKey: "USER_TYPE_DEMAND_LISTING_ENABLED" },
                            { fieldKey: "USER_TYPE_SUPPLY_LISTING_ENABLED" },
                        ]
                    }
                })
                .then((configFields) => {
                    demandListingsEnabled = configFields[0];
                    supplyListingsEnabled = configFields[1];

                    cb();
                }, cb)
		], err => {
			if (err) {
				return console.error(err);
			}


			emailService.checkEmailScenarioForUser(emailCode, supplyUserType, demandListingsEnabled, supplyListingsEnabled, () => {
				emailService
					.checkIfShouldSendEmail(models, emailCode, supplyUserId, () => {
                        emailService.getEmailAndSend(models, emailCode, supplyEmails, emailData);
                        if (emailsTriggeredByEvent.length) {
                            emailsTriggeredByEvent.map(eventEmailCode => {
                                emailService
                                .checkIfShouldSendEmail(models, eventEmailCode.code, supplyUserId, () => emailService.getEmailAndSend(models, eventEmailCode.code, supplyEmails, emailData));
                            });
                            
                        }
                    });
			});
            emailService.checkEmailScenarioForUser(emailCode, demandUserType, demandListingsEnabled, supplyListingsEnabled, () => {
				emailService
					.checkIfShouldSendEmail(models, emailCode, demandUserId, () => {
                        emailService.getEmailAndSend(models, emailCode, demandEmails, emailData);
                        if (emailsTriggeredByEvent.length) {
                            emailsTriggeredByEvent.map(eventEmailCode => {
                                emailService
                                .checkIfShouldSendEmail(models, eventEmailCode.code, demandUserId, () => emailService.getEmailAndSend(models, eventEmailCode.code, demandEmails, emailData));
                            });
                            
                        }
                    });
			});

/* 			// its handled by order-marked-as-done
			if (emailCode === "request-marked-as-done") {
				if (supplyEmails) {
					emailService
					.checkIfShouldSendEmail(models, emailCode, supplyUserId, () =>
						emailService.sendEmailsOnEvent(models, emailCode, [], supplyEmails, emailData)
					);
				}
				
				if (demandEmails) {
					emailService
					.checkIfShouldSendEmail(models, emailCode, demandUserId, () =>
						emailService.sendEmailsOnEvent(models, emailCode, demandEmails, [], emailData)
					);
				}

				return;
			} */

/* 			// its handled by order-completed
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
			} */

/* 			emailService
			.checkIfShouldSendEmail(models, emailCode, request.userId, () =>
				emailService.getEmailAndSend(models, emailCode, supplyEmails, emailData)
			); */
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
		requestEventHandlerFactory("request-closed", (domain, requestId) =>
			`${domain}/app/request/${requestId}/review`
		)
	);

requestEmitter
	.on("request-declined",
	requestEventHandlerFactory("request-declined", (domain) => 
		`${domain}/app`
	)
);

requestEmitter
	.on("request-cancelled",
		requestEventHandlerFactory("request-cancelled", (domain) =>
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
