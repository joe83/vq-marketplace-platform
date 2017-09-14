"use strict";

const EventEmitter = require('events');
const async = require('async');
const randtoken = require('rand-token');
const models = require("../models/models");
const EmailService = require("../services/emailService.js");
const config = require("../config/configProvider.js")();
const vqAuth = require("../config/vqAuthProvider");

class DefaultEmitter extends EventEmitter {}

const orderEmitter = new DefaultEmitter();

const getOrderOwnerEmails = (orderId, cb) => {
    let emails, order;

    return async.waterfall([
        cb => models
            .order
            .findOne({
                where: {
                    id: orderId
                },
                include: [
                    { model: models.user }
                ]
            })
            .then(rOrder => {
                if (!rOrder) {
                    return cb({
                        code: 'ORDER_NOT_FOUND'
                    });
                }
                
                order = rOrder;

                return cb();
            }, cb),
        cb => vqAuth
            .getEmailsFromUserId(order.user.vqUserId, (err, rUserEmails) => {
                if (err) {
                    return cb(err);
                }

                emails = rUserEmails
                    .map(_ => _.email);

                cb();
            })
        ], err => {
            return cb(err, {
                order,
                emails
            });
        });
};

const orderEventHandlerFactory = (emailCode, actionUrlFn) => {
	return orderId => {
		var user, order;
		var emails;
		var ACTION_URL;

		async.waterfall([
			cb => getOrderOwnerEmails(orderId, (err, data) => {
                if (err) {
                    return cb(err);
                }

                emails = data.emails;
                order = data.order;

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
						actionUrlFn(domain, order.requestId);

					cb();
				}, cb)
		], err => {
			if (err) {
				return console.error(err);
			}

			if (emails) {
				EmailService
					.getEmailAndSend(emailCode, emails[0], ACTION_URL);
			} else {
                console.log('No emails to send notification!');
            }
		})
    };
};

orderEmitter
    .on('closed',
        orderId =>
            orderEventHandlerFactory('order-closed',
                domain => `${domain}/app/dashboard`
            )(orderId)
    );

orderEmitter
	.on('new-order', 
        orderId =>
            orderEventHandlerFactory('new-order', (domain, requestId) => `${domain}/app/chat/${requestId}`)(orderId)
    );

orderEmitter
	.on('order-completed', 
        orderId =>
            orderEventHandlerFactory('order-completed', (domain, requestId) => `${domain}/app/chat/${requestId}`)(orderId)
    );

orderEmitter
	.on('order-marked-as-done', 
        orderId =>
            orderEventHandlerFactory('order-marked-as-done', (domain, requestId) => `${domain}/app/chat/${requestId}`)(orderId)
    );

if (module.parent) {
	module.exports = orderEmitter;
} else {
	console.log(process.argv[2])
	console.log(process.argv[3])
	
	orderEmitter.emit(process.argv[2], process.argv[3]);
}