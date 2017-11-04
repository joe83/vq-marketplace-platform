const async = require("async");
const responseController = require("../controllers/responseController");
const models = require("../models/models");
const isLoggedIn = responseController.isLoggedIn;
const sendResponse = responseController.sendResponse;
const orderEmitter = require("../events/order");
const requestEmitter = require("../events/request");
const orderCtrl = require("../controllers/orderCtrl");
const requestCtrl = require("../controllers/requestCtrl");
const RESOURCE = "order";

module.exports = app => {
    app.post(`/api/${RESOURCE}`,
        isLoggedIn,
        (req, res) => {
            const order = req.body;
            var createdOrder;

            order.userId = req.user.id;
            order.status = req.models.order.ORDER_STATUS.PENDING;

            async.waterfall([
                cb => req.models.order
                    .create(order)
                    .then(rCreatedOrder => {
                        createdOrder = rCreatedOrder;

                        cb();
                    }, cb),
                cb => req.models.request
                    .update({
                        status: req.models.request.REQUEST_STATUS.ACCEPTED
                    }, {
                        where: {
                            id: order.requestId
                        }
                    })
                    .then(() => cb(), cb),
                cb => requestCtrl
                    .declineAllPendingRequestsForTask(req.models, order.taskId, cb),
                cb => req.models.task
                    .update({
                        status: req.models.task.TASK_STATUS.BOOKED
                    }, {
                        where: {
                            id: order.taskId
                        }
                    })
                    .then(() => cb(), cb)
            ], err => {
                if (err) {
                    return sendResponse(res, err);
                }

                sendResponse(res, null, createdOrder);

                orderEmitter
                    .emit("new-order", req.models, createdOrder.id);

                requestEmitter
                    .emit("request-accepted", req.models, createdOrder.requestId);
            });
        });

    app.get(`/api/${RESOURCE}/:${RESOURCE}Id`,
        isLoggedIn,
        (req, res) => {
            const orderId = req.params.orderId;
            const userId = req.user.id;
            const where = {
                $and: [
                    { userId },
                    { id: orderId }
                ]
            };

            req.models.order
            .findOne({
                where,
                include: [
                    {
                        model: req.models.user
                    },
                    {
                        model: req.models.request,
                        include: [
                            { model: req.models.user, as: "fromUser" },
                            { model: req.models.user, as: "toUser" }
                        ]
                    },
                    {
                        model: req.models.task
                    },
                    {
                        model: req.models.review
                    }
                ]
            })
            .then(order => {
                if (!order) {
                    return sendResponse(res, {
                        code: "ORDER_NOT_FOUND"
                    });
                }

                return sendResponse(res, null, order);
            }, err => {
                sendResponse(res, err);
            });
        });

    app.get(`/api/${RESOURCE}`,
        isLoggedIn,
        (req, res) => {
            const userId = req.user.id;
            const where = {
                $and: [
                    { userId }
                ]
            };

            if (req.query.view === "in_progress") {
                where.$and.push({
                    $or: [
                        { status: req.models.order.ORDER_STATUS.PENDING },
                        { status: req.models.order.ORDER_STATUS.MARKED_DONE }
                    ]
                });
            }

            if (req.query.view === "completed") {
                where.$and
                .push({
                    $or: [
                        {
                            status: req.models.order.ORDER_STATUS.SETTLED
                        }, {
                            status: req.models.order.ORDER_STATUS.CLOSED
                        }
                    ]
                });
            }

            req.models.order
            .findAll({
                where,
                include: [
                    {
                        model: req.models.user
                    },
                    {
                        model: req.models.request,
                    },
                    {
                        model: req.models.task,
                        include: [
                            {
                                model: req.models.taskLocation
                            },
                            {
                                model: req.models.taskTiming
                            }
                        ]
                    },
                    {
                        model: req.models.review
                    }
                ]
            })
            .then(orders => {
                orders = orders
                    .filter(order => order.request);
                
                async
                    .eachLimit(orders, 3, (order, cb) => {
                        const data = {};
                        const fromUserId = order.request.fromUserId;
                        const task = order.task;

                        async.parallel([
                            cb =>
                                req.models.taskCategory
                                .findAll({
                                    where: {
                                        taskId: task.id
                                    }
                                })
                                .then(categories => {
                                    task.dataValues.categories = categories;
    
                                    return cb();
                                }, cb),
                            cb => req.models.user.findOne({
                                where: {
                                    id: fromUserId
                                },
                                include: [
                                    {
                                        model: req.models.userProperty
                                    }
                                ]
                            })
                            .then(user => {
                                order = order.dataValues;
                                order.fromUser = user.dataValues;
    
                                return cb();
                            }, cb)
                        ], err => {
                            if (err) {
                                return cb(err);
                            }
    
                            return cb();
                        });
                    }, err => {
                        sendResponse(res, err, orders);
                    });
            })
            .catch(err => sendResponse(res, err));
        });

        
    app.put("/api/order/:orderId/actions/close",
        isLoggedIn,
        (req, res) => {
            const orderId = req.params.orderId;
            const userId = req.user.id;

            req.models.order
            .findOne({
                where: {
                    $and: [
                        {
                            id: orderId
                        }, {
                            userId
                        }, {
                            $or: [
                                {
                                status: req.models.order.ORDER_STATUS.MARKED_DONE
                                }, {
                                    status: req.models.order.ORDER_STATUS.PENDING
                                }
                            ]
                        }
                    ]
                }
            })
            .then(order => {
                if (!order) {
                    return sendResponse(res, {
                        code: "NOT_FOUND"
                    });
                }
                
                req.models
                    .request
                    .update({
                        autoSettlementStartedAt: null,
                        status: req.models.request.REQUEST_STATUS.CLOSED
                    }, {
                        where: {
                            id: order.requestId
                        }
                    })
                    .then(data => {
                        requestEmitter.emit("closed", req.models, order.requestId);

                        order
                        .update({
                            status: req.models.order.ORDER_STATUS.CLOSED
                        })
                        .then(_ => {
                            orderEmitter.emit("closed", req.models, order.id);

                            sendResponse(res, null, {
                                ok: "ok"
                            });
                        }, err => sendResponse(res, err));
                    }, err => sendResponse(res, err));
            });
        });

    app.put("/api/order/:orderId/actions/cancel-autosettlement",
        isLoggedIn,
        (req, res) => {
            const orderId = req.params.orderId;
            const userId = req.user.id;

            req.models.order
                .update({
                    autoSettlementStartedAt: null
                }, {
                    where: {
                        $and: [
                            {
                                id: orderId
                            }, {
                                userId
                            }
                        ]
                    }
                })
                .then(order => {
                    sendResponse(res, null, { ok: "ok" });
                }, err => sendResponse(res, err));
        });

    /**
     * Settles the order and the underlying request
     */
    app.put("/api/order/:orderId",
        isLoggedIn,
        (req, res) => {
            const orderId = req.params.orderId;
            
            orderCtrl
                .settleOrder(req.models, orderId, req.user.id, (err, order) => {
                sendResponse(res, err, order);
            });
        });
};