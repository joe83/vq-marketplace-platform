const async = require("async");
const stripeProvider = require("../../shared-providers/stripe");
const orderEmitter = require("../events/order");
const requestEmitter = require("../events/request");
const utils = require("../utils");

const settleOrder = (models, orderId, userId, cb) => {
    var requestId;
    var order;
    
    userId = Number(userId);
    orderId = Number(orderId);
    
    async.waterfall([
        cb => models.order
            .findById(orderId)
            .then(rOrder => {
                if (!rOrder) {
                    return cb("NOT_FOUND");
                }
             
                if (rOrder.userId !== userId) {
                    return cb("NOT_AUTHORIZED_TO_SETTLE");
                }

                const possibleStatusForUpdate = [
                    models.order.ORDER_STATUS.MARKED_DONE,
                    models.order.ORDER_STATUS.PENDING
                ];

                if (
                    possibleStatusForUpdate.indexOf(rOrder.status) === -1
                ) {
                    return cb("WRONG_STATUS");
                }

                order = rOrder;
                requestId = order.requestId;

                return cb();
            }, cb),
        /**
         * WE CAPTURE THE CHARGE!
         */
        cb => {
            const stripe = stripeProvider
                .getTenantStripe();

            models
            .paymentObject
            .findOne({
                where: {
                    $and: [
                        { type: "charge" },
                        { orderId: order.id }
                    ]
                }
            })
            .then(rCharge => {
                stripe
                .charges
                .capture(rCharge.obj.id, err => {
                    cb(err);
                });
            }, cb);
        },
        cb => models.order
            .update({
                status: models.order.ORDER_STATUS.SETTLED,
                settledAt: utils.getUtcUnixTimeNow()
            }, {
                where: {
                    id: orderId
                }
            })
            .then(() => cb(), cb),
        cb => {
            models.request
            .update({
                status: models.request.REQUEST_STATUS.SETTLED
            }, {
                where: {
                    id: requestId
                }
            })
            .then(() => cb(), cb);
        }
    ], err => {
        if (err) {
            return cb(err);
        }
       
        requestEmitter
            .emit("request-completed", models, requestId);

        orderEmitter
             .emit("order-completed", models, orderId);

        cb(null, order);
    });
};

if (module.parent) {
    module.exports = {
        settleOrder
    };
} else {
    settleOrder(process.argv[2], process.argv[3], err => {
        if (err) {
            return console.error(err);
        }
        
        console.log("SUCCESS");
    });
}
