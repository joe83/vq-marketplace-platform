const EventEmitter = require("events");
const async = require("async");
const emailService = require("../services/emailService.js");
const vqAuth = require("../auth");

class DefaultEmitter extends EventEmitter {}

var orderEmitter = new DefaultEmitter();

const getOrderOwnerEmails = (models, orderId, cb) => {
    let emails, supplyEmails, supplyUserId, order, task, request;

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
                request = rOrder.request;

                return cb();
            }, cb),

        // get demand user emails
        cb => vqAuth
            .getEmailsFromUserId(models, order.user.vqUserId, (err, rUserEmails) => {
                if (err) {
                    return cb(err);
                }

                emails = rUserEmails
                    .map(_ => _.email);

                return cb();
            }),

        // get supplier emails
        cb => {
            supplyUserId = request.fromUser.vqUserId === order.user.vqUserId ?
                request.toUser.vqUserId :
                request.fromUser.vqUserId;

            vqAuth
            .getEmailsFromUserId(models, supplyUserId,
                (err, rUserEmails) => {
                    if (err) {
                        return cb(err);
                    }

                    supplyEmails = rUserEmails
                        .map(_ => _.email);

                    return cb();
            })
        }
        ], err => {
            return cb(err, {
                supplyUserId: 
                task,
                order,
                emails,
                supplyEmails
            });
        });
};

const orderEventHandlerFactory = (emailCode, actionUrlFn) => {
	return (models, orderId) => {
		var order, task;
		var emails, supplyEmails, supplyUserId;
		var ACTION_URL;

		async.waterfall([
			cb => getOrderOwnerEmails(models, orderId, (err, data) => {
                if (err) {
                    return cb(err);
                }

                supplyEmails = data.supplyEmails;
                emails = data.emails;
                order = data.order;
                task = data.task;
                supplyUserId = data.supplyUserId;

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
 
            const emailData = {
                ACTION_URL,
                LISTING_TITLE: task.title,
                ORDER_ID: order.id,
                ORDER_CURRENCY: order.currency,
                ORDER_AMOUNT: order.amount,
                ORDER_CREATED_AT: order.createdAt
            };

            if (task.taskType === 2 && supplyEmails) {
                emailService
                .checkIfShouldSendEmail(models, "new-order-for-supply", supplyUserId, () =>
                    emailService
                    .getEmailAndSend(models, "new-order-for-supply", supplyEmails, emailData)
                );
			}

			if (emails) {
                emailService
                .checkIfShouldSendEmail(models, emailCode, order.userId, () =>
                    emailService
                    .getEmailAndSend(models, emailCode, emails, emailData)
                );
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
