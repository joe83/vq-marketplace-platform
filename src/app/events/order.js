const EventEmitter = require("events");
const async = require("async");
const db = require("../models/models");
const randtoken = require("rand-token");
const emailService = require("../services/emailService.js");
const vqAuth = require("../auth");

class DefaultEmitter extends EventEmitter {}

var orderEmitter = new DefaultEmitter();

const getOrderOwnerEmails = (models, orderId, cb) => {
    let emails, order, task;

    return async.waterfall([
        cb => models
            .order
            .findOne({
                where: {
                    id: orderId
                },
                include: [
                    { model: models.task },
                    { model: models.user },
                    { 
                        model: models.request,
                        include: [
                            { model: models.user, as: "fromUser" }
                        ]
                    }
                ]
            })
            .then(rOrder => {
                if (!rOrder) {
                    return cb({
                        code: "ORDER_NOT_FOUND"
                    });
                }
                
                order = rOrder;
                task = rOrder.task;

                return cb();
            }, cb),
        cb => vqAuth
            .getEmailsFromUserId(models, order.user.vqUserId, (err, rUserEmails) => {
                if (err) {
                    return cb(err);
                }

                emails = rUserEmails
                    .map(_ => _.email);

                cb();
            })
        ], err => {
            return cb(err, {
                task,
                order,
                emails
            });
        });
};

const orderEventHandlerFactory = (emailCode, actionUrlFn) => {
	return (models, orderId) => {
		var user, order, task;
		var emails;
		var ACTION_URL;

		async.waterfall([
			cb => getOrderOwnerEmails(models, orderId, (err, data) => {
                if (err) {
                    return cb(err);
                }

                emails = data.emails;
                order = data.order;
                task = data.task;

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
						actionUrlFn(domain, order.requestId, order.id);

					cb();
				}, cb)
		], err => {
			if (err) {
				return console.error(err);
			}
 
			if (emails) {
                emailService
                .checkIfShouldSendEmail(models, emailCode, order.userId, () =>
                    emailService
                    .getEmailAndSend(models, emailCode, emails, {
                        ACTION_URL,
                        LISTING_TITLE: task.title
                    })
                );
			} else {
                console.log("No emails to send notification!");
            }
		});
    };
};

orderEmitter
    .on("closed",
        orderEventHandlerFactory("order-closed", (domain, requestId, orderId) =>
            `${domain}/app/order/${orderId}/review`
        )
    );

orderEmitter
	.on("order-completed", 
        orderEventHandlerFactory("order-completed", (domain, requestId, orderId) =>
            `${domain}/app/order/${orderId}/review`
        )
    );    

orderEmitter
    .on("new-order", 
        orderEventHandlerFactory("new-order", (domain, requestId) =>
            `${domain}/app/chat/${requestId}`
        )
    );

orderEmitter
	.on("order-marked-as-done", 
        orderEventHandlerFactory("order-marked-as-done", (domain, requestId) =>
            `${domain}/app/chat/${requestId}`
        )
    );

module.exports = orderEmitter;
