const async = require('async');
const moment = require('moment');
const cust = require("../config/customizing.js");
const models  = require('../models/models');
const requestEmitter = require("../events/request");
const orderEmitter = require("../events/order");

const changeRequestStatus = (requestId, newStatus, userId, cb) => {
    newStatus = String(newStatus);
    userId = Number(userId);
    requestId = Number(requestId);

    var request, order, oldRequest;

    var autoSettlementEnabled = false;

    const REQUEST_STATUS = models.request.REQUEST_STATUS;

    async.waterfall([
        cb => {
            models
            .request
            .findById(requestId)
            .then(rOldRequest => {
                if (!rOldRequest) {
                    return cb('REQUEST_NOT_FOUND');
                }

                if (rOldRequest.status === newStatus) {
                    return cb('NO_ACTION_REQUIRED');
                }

                oldRequest = rOldRequest;
                
                return cb();
            });
        },
        cb => {
            models.request
            .update({
                status: newStatus
            }, {
                where: {
                    id: requestId,
                    fromUserId: userId
                }
            })
            .then(rRequest => {
                request = rRequest;

                cb();
            }, cb)
        },
        cb => {
            if (newStatus !== models.request.REQUEST_STATUS.MARKED_DONE) {
                return cb();
            }
            
            if (newStatus === models.request.REQUEST_STATUS.MARKED_DONE) {
                const autoSettlementStartedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
                
                // @TODO - support for 1 request - 1 order relation. Need for more pricing models.
                models.order
                .findOne({
                    where: {
                        requestId
                    }
                })
                .then(rOrder => {
                    order = rOrder;

                    order
                        .updateAttributes({
                            autoSettlementStartedAt,
                            status: models.order.ORDER_STATUS.MARKED_DONE
                        })
                        .then(_ => cb(), cb)
                }, cb);
            }
        }
    ], err => {
        if (err) {
            return cb(err);
        }

        if (newStatus === models.request.REQUEST_STATUS.MARKED_DONE) {
            requestEmitter
                .emit('request-marked-as-done', requestId);

            orderEmitter
                .emit('order-marked-as-done', order.id)
        }

        return cb();
    });
};

module.exports = {
    changeRequestStatus
};