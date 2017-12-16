const async = require("async");
const requestEmitter = require("../events/request");
const orderEmitter = require("../events/order");
const taskEmitter = require("../events/task");
const utils = require("../utils");

const declineRequest = (models: any, requestId: number, cb: any) => {
    models
    .request
    .findById(requestId)
    .then((request: any) => {
        request
        .update({
            status: models.request.REQUEST_STATUS.DECLINED
        });

        if (cb) {
            cb();
        }

        requestEmitter.emit("request-declined", models, request.id);
    }, cb);
};

const declineAllPendingRequestsForTask = (models: any, taskId: number, cb: any) => {
    models.request.findAll({
        where: {
            $and: [
                { taskId: taskId },
                { status: models.request.REQUEST_STATUS.PENDING }
            ]
        }
    }).then((pendingRequests: any[]) => {
        async.eachSeries(pendingRequests, (request: any, cb: any) => {
            return declineRequest(models, request.id, cb);
        }, cb);
    });
};

const changeRequestStatus = (models: any, requestId: number, newStatus: string, userId: number, cb: any) => {
    newStatus = String(newStatus);
    userId = Number(userId);
    requestId = Number(requestId);

    var order: any, oldRequest: any;

    async.waterfall([
        (cb: any) => {
            models
            .request
            .findById(requestId)
            .then((requestRef: any) => {
                if (!requestRef) {
                    return cb({
                        code: "REQUEST_NOT_FOUND"
                    });
                }

                if (requestRef.status === newStatus) {
                    return cb({
                        code: "NO_ACTION_REQUIRED"
                    });
                }
                
                return cb(null, requestRef);
            });
        },
        (requestRef: any, cb: any) => {
            if (requestRef.fromUserId !== userId) {
                return cb({
                    code: "NOT_YOUR_REQUEST"
                });
            }

            requestRef.update({
                status: newStatus
            })
            .then(() => cb(), cb);
        },
        (cb: any) => {
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
                .then((rOrder: any) => {
                    order = rOrder;

                    order
                        .updateAttributes({
                            autoSettlementStartedAt,
                            status: models.order.ORDER_STATUS.MARKED_DONE
                        })
                        .then(() => cb(), cb);
                }, cb);
            }
        }
    ], (err: Error) => {
        if (err) {
            return cb(err);
        }

        if (newStatus === models.request.REQUEST_STATUS.MARKED_DONE) {
            requestEmitter
                .emit("request-marked-as-done", models, requestId);

            orderEmitter
                .emit("order-marked-as-done", models, order.id);
        }

        if (newStatus === models.request.REQUEST_STATUS.CANCELED) {
            models
                .task
                .findById(oldRequest.taskId)
                .then((rTask: any) => {
                    taskEmitter
                        .emit("task-request-cancelled", models, rTask);
                    
                    requestEmitter
                        .emit("request-cancelled", models, requestId);
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
