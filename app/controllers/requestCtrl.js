const async = require('async');
const moment = require('moment');
const cust = require("../config/customizing.js");
const db  = require('../models/models');
const requestEmitter = require("../events/request");
const orderEmitter = require("../events/order");
const taskEmitter = require("../events/task");
const utils = require("../utils");

const declineRequest = (models, requestId, cb) => {
    const newStatus = models.request.REQUEST_STATUS.DECLINED;
  
    models
    .request
    .findById(requestId)
    .then(request => {
        request
        .update({
            status: models.request.REQUEST_STATUS.DECLINED
        });

        if (cb) {
            cb();
        }

        requestEmitter.emit('request-declined', models, request.id);
    }, cb);
};

const declineAllPendingRequestsForTask = (models, taskId, cb) => {
    models.request.findAll({
        where: {
            $and: [
                { taskId: taskId },
                { status: models.request.REQUEST_STATUS.PENDING }
            ]
        }
    }).then(pendingRequests => {
        async.eachSeries(pendingRequests, (request, cb) => {
            return declineRequest(models, request.id, cb);
        }, cb);
    });
};

const changeRequestStatus = (models, requestId, newStatus, userId, cb) => {
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
                // request = rRequest;

                cb();
            }, cb)
        },
        cb => {
            if (newStatus !== models.request.REQUEST_STATUS.MARKED_DONE) {
                return cb();
            }
            
            if (newStatus === models.request.REQUEST_STATUS.MARKED_DONE) {
                const autoSettlementStartedAt = utils.getUtcUnixTimeNow();
                
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
                .emit('request-marked-as-done', models, requestId);

            orderEmitter
                .emit('order-marked-as-done', models, order.id)
        }

        if (newStatus === models.request.REQUEST_STATUS.CANCELED) {
            models
                .task
                .findById(oldRequest.taskId)
                .then(rTask => {
                    taskEmitter
                        .emit('task-request-cancelled', models, rTask);
                    
                    requestEmitter
                        .emit('request-cancelled', models, requestId);
                });
        }

        return cb(null, oldRequest);
    });
};

module.exports = {
    declineAllPendingRequestsForTask,
    changeRequestStatus,
    declineRequest
};