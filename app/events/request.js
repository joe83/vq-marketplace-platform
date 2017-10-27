"use strict";

const EventEmitter = require('events');
const async = require('async');
const randtoken = require('rand-token');
const models = require("../models/models");
const orderCtrl = require("../controllers/orderCtrl.js");
const emailService = require("../services/emailService.js");
const config = require("../config/configProvider.js")();
const vqAuth = require("../config/vqAuthProvider");

class DefaultEmitter extends EventEmitter {}

const requestEmitter = new DefaultEmitter();

const getRequestOwnerEmails = (requestId, cb) => {
    let emails, request, order, task;

    return async.waterfall([
        cb => models
            .request
            .findOne({
                where: {
                    id: requestId
                },
                include: [
					{ model: models.user, as: 'fromUser' },
					{ model: models.task, as: 'task' }
                ]
            })
            .then(rRequest => {
				request = rRequest;
				task = rRequest.task;

                return cb();
			}, cb),
		cb => {
			orderCtrl.getOrderFromRequest(requestId, (err, rOrder) => {
				if (err) {
					return cb(err);
				}

				order = rOrder;

				return cb();
			});
		},
        cb => vqAuth
            .getEmailsFromUserId(request.fromUser.vqUserId, (err, rUserEmails) => {
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
	return requestId => {
		var user, request, order, task;
		var emails;
		var ACTION_URL;
		var emailData = {};

		async.waterfall([
			cb => getRequestOwnerEmails(requestId, (err, data) => {
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
						fieldKey: 'DOMAIN'
					}
				})
				.then(configField => {
					configField = configField || {};
					
					const domain = configField.fieldValue || 'http://localhost:3000';

					emailData.ACTION_URL = 
						actionUrlFn(domain, requestId, order.id);

					emailData.LISTING_TITLE = task.title;

					cb();
				}, cb)
		], err => {
			if (err) {
				return console.error(err);
			}

			if (emails) {
				emailService
				.checkIfShouldSendEmail(emailCode, request.fromUser.id, () => {
					emailService
					.getEmailAndSend(emailCode, emails[0], emailData);
				});
			}
		});
	};
};

requestEmitter
	.on('message-received', (messageRef) => {
		emailService
		.checkIfShouldSendEmail('message-received', messageRef.toUserId, () => {
			models.user
			.findById(messageRef.toUserId)
			.then(user => {
				vqAuth
				.getEmailsFromUserId(user.vqUserId, (err, rUserEmails) => {
					if (err) {
						return console.error(err);
					}
	
					const emails = rUserEmails
						.map(_ => _.email);
	
						models
						.appConfig
						.findOne({
							where: {
								fieldKey: 'DOMAIN'
							}
						})
						.then(configField => {
							configField = configField || {};
							
							const domain = configField.fieldValue || 'http://localhost:3000';
		
							const ACTION_URL = `${domain}/app/chat/${messageRef.requestId}`;
		
							emailService
							.getEmailAndSend('message-received', emails[0], ACTION_URL);
						}, err => {
							return console.error(err);
						})
				});
			});
		});
	});

requestEmitter
	.on('request-accepted', 
		requestEventHandlerFactory('request-accepted', (domain, requestId) => `${domain}/app/chat/${requestId}`)
	);

requestEmitter
	.on('request-completed', 
		requestEventHandlerFactory('request-completed', (domain, requestId, orderId) =>
			`${domain}/app/order/${orderId}/review`
		)
	);

requestEmitter
	.on('closed',
		requestId =>
			requestEventHandlerFactory('request-closed',
				(domain, requestId, orderId) => `${domain}/app/order/${orderId}/review`
			)(requestId)
	);

requestEmitter
	.on('request-declined',
	requestEventHandlerFactory('request-declined', (domain, requestId) => 
		`${domain}/app`
	)
);

requestEmitter
	.on('request-cancelled',
		requestEventHandlerFactory('request-cancelled', (domain, requestId) =>
			`${domain}/app`
		)
	);

requestEmitter
	.on('request-marked-as-done',
		requestId =>
			requestEventHandlerFactory('request-marked-as-done',
				(domain) => `${domain}/app/dashboard`
			)(requestId)
	);

requestEmitter
	.on('new-message', messageRef => {
		
	});

requestEmitter
	.on('new-request', requestId => {
		var fromUser, toUser, request;
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
						{ model: models.user, as: 'fromUser' },
						{ model: models.user, as: 'toUser' }
					]
				})
				.then(rRequest => {
					request = rRequest;

					return cb();
				}, cb),
			cb => vqAuth
				.getEmailsFromUserId(request.fromUser.vqUserId, (err, rUserEmails) => {
					if (err) {
						return cb(err);
					}

					requestSentEmails = rUserEmails
						.map(_ => _.email);

					cb();
				}),
			cb => vqAuth
				.getEmailsFromUserId(request.toUser.vqUserId, (err, rUserEmails) => {
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
						fieldKey: 'DOMAIN'
					}
				})
				.then(configField => {
					configField = configField || {};
					
					const domain = configField.fieldValue || 'http://localhost:3000';

					ACTION_URL = 
						`${domain}/app/chat/${requestId}`;

					cb();
				}, cb)
		], err => {
			if (err) {
				return console.error(err);
			}


			if (requestReceivedEmails) {
				emailService
				.checkIfShouldSendEmail('new-request-received', request.toUser.id, () => {
					emailService
					.getEmailAndSend('new-request-received', requestReceivedEmails[0], ACTION_URL);
				});
			}
			
			if (requestSentEmails) {
				emailService
				.checkIfShouldSendEmail('new-request-sent', request.fromUser.id, () => {
					emailService
					.getEmailAndSend('new-request-sent', requestSentEmails[0], ACTION_URL);
				});
			}
		})
	});


if (module.parent) {
	module.exports = requestEmitter;
} else {
	console.log(process.argv[2])
	console.log(process.argv[3])
	
	requestEmitter.emit(process.argv[2], process.argv[3]);
}