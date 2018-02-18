const async = require("async");
const responseController = require("../controllers/responseController");
const stripeProvider = require("../../shared-providers/stripe");
const isLoggedIn = responseController.isLoggedIn;
const sendResponse = responseController.sendResponse;
const orderEmitter = require("../events/order");
const requestEmitter = require("../events/request");
const orderCtrl = require("../controllers/orderCtrl");
const requestCtrl = require("../controllers/requestCtrl");
const RESOURCE = "order";

module.exports = app => {

    /**
     * Order can only be created from a request sent to supply or demand listing.
     * Orders can only by created by Demand Users.
     * A request can only be booked once!
     */
    app.post(`/api/${RESOURCE}`,
        isLoggedIn,
        (req, res) => {
            let createdOrder, requestRef, taskRef, userPaymentAccount, stripePrivateKey, paymentsEnabledConfig;
            const order = req.body;

            order.userId = req.user.id;
            order.status = req.models.order.ORDER_STATUS.PENDING;

            async.waterfall([
                // gets the request
                cb => orderCtrl
                .tryGetPaymentConfigs(req.models, (err, paymentConfigs) => {
                    if (err) {
                        return cb(err);
                    }
        
                    paymentsEnabledConfig = paymentConfigs.paymentsEnabledConfig;
                    stripePrivateKey = paymentConfigs.stripePrivateKeyConfig;
        
                    cb();
                }),
                cb => req.models.task
                    .findById(order.taskId)
                    .then(rTask => {
                        taskRef = rTask;

                        cb();
                    }, cb),

                // gets the request
                cb => req.models.request
                    .findById(order.requestId)
                    .then(rRequest => {
                        requestRef = rRequest;

                        if (requestRef.status !== req.models.request.REQUEST_STATUS.PENDING) {
                            return cb({
                                httpCode: 400,
                                code: "WRONG_REQUEST_STATUS"
                            });
                        }

                        cb();
                    }, cb),

                // gets payment account of the supplier
                cb => {
                    if (!paymentsEnabledConfig || paymentsEnabledConfig.fieldValue !== "1") {
                        return cb();
                    }

                    const DEMAND_TASK_TYPE_CODE = 1;

                    const supplyUserId = taskRef.taskType === DEMAND_TASK_TYPE_CODE ?
                        requestRef.fromUserId :
                        requestRef.toUserId;

                    req
                    .models
                    .userPaymentAccount
                    .findOne({
                        where: {
                            $and: [
                                { userId: supplyUserId },
                                { networkId: "stripe" }
                            ]
                        }
                    })
                    .then(rUserPaymentAccount => {
                        if (!rUserPaymentAccount) {
                            return cb({
                                httpCode: 400,
                                code: "NO_SUPPLY_PAYMENT_ACCOUNT"
                            });
                        }

                        userPaymentAccount = rUserPaymentAccount;

                        cb();
                    }, cb);
                },

                // creating initial order
                cb => req.models.order
                    .create(order)
                    .then(rCreatedOrder => {
                        createdOrder = rCreatedOrder;

                        cb();
                    }, cb),
                cb => {
                    if (!paymentsEnabledConfig || paymentsEnabledConfig.fieldValue !== "1") {
                        return cb();
                    }

                    let provisionConfig, paymentObjectCard, charge;

                    async.waterfall([
                        cb => {
                            req
                            .models
                            .paymentObject
                            .findOne({
                                where: {
                                    $and: [
                                        { userId: req.user.id },
                                        { provider: "stripe" },
                                        { type: "card" }
                                    ]
                                }
                            })
                            .then(rPaymentObjectCard => {
                                if (!rPaymentObjectCard) {
                                    return cb({
                                        httpCode: 400,
                                        code: "NO_PAYMENT_METHOD"
                                    });
                                }

                                paymentObjectCard = rPaymentObjectCard;

                                cb();
                            }, cb);
                        },
                        cb => {
                            const platformFeeRelative = Number(provisionConfig.fieldValue) / 100 || 0;
                            const totalAmount = createdOrder.currency === "HUF" ?
                                createdOrder.amount :
                                createdOrder.amount * 100;

                            const platformFees = Math.floor(totalAmount * platformFeeRelative);

                            let amountToBeTransferred = totalAmount - platformFees;

                            const chargeData = {
                                capture: false,
                                amount: totalAmount,
                                currency: createdOrder.currency,
                                description:
                                `"${taskRef.title}" - BookingId: ${createdOrder.id}, UserId: ${req.user.id}, RequestId: ${createdOrder.requestId}`,
                                source: paymentObjectCard.obj.id,
                                destination: {
                                    amount: amountToBeTransferred,
                                    account: userPaymentAccount.accountId
                                },
                                metadata: {
                                    orderId: createdOrder.id,
                                    requestId: createdOrder.requestId,
                                    userId: req.user.id 
                                }
                            };

                            console.log("Creating StripeCharge");
                            console.log(chargeData);

                            stripeProvider
                            .getTenantStripe(stripePrivateKey.fieldValue)
                            .charges
                            .create(chargeData, (err, rCharge) => {
                                if (err) {
                                    return cb({
                                        code: "PAYMENT_ERROR",
                                        err
                                    });
                                }

                                charge = rCharge;

                                cb();
                            });
                        },
                        cb => {
                            req
                            .models
                            .paymentObject
                            .create({
                                userId: req.user.id,
                                orderId: createdOrder.id,
                                provider: "stripe",
                                type: "charge",
                                obj: charge,
                            })
                            .then(() => {
                                return cb();
                            }, cb);
                        }
                    ], cb);
                },
                cb => requestRef
                    .update({
                        status: req.models.request.REQUEST_STATUS.ACCEPTED
                    })
                    .then(() => cb(), cb),

                /**
                 * @configure-it start
                 * THIS FUNCTIONALITY NEEDS TO BE REVIEWED AND MADE CONFIGURABLE WHEN WE SUPPORT NEW USECASES
                 * Right now we cover:
                 * A) applications (taskrabbit, click4work)
                 * B) instant rental bookings (airbnb, rentkitchen)
                 */
               
                cb => {
                     // @todo: this needs to be made configurable!

                     /**
                      * Request handling for DEMAND (1) Listings
                      * All other requests are declined.
                      */
                     if (Number(taskRef.taskType) === 1) {
                        requestCtrl
                            .declineAllPendingRequestsForTask(req.models, order.taskId, cb)
                     }

                    /**
                      * Request handling for SUPPLY (2) Listings
                      * All other requests remain until declined manually or listing deactived.
                      */
                     if (Number(taskRef.taskType) === 2) {
                        cb();
                     }
                },
                cb => {
                    /**
                      * Task handling for DEMAND (1) Listings
                      * Task is marked as booked and removed from the pool of active listings.
                      */
                    if (Number(taskRef.taskType) === 1) {
                        return req.models.task
                            .update({
                                status: req.models.task.TASK_STATUS.BOOKED
                            }, {
                                where: {
                                    id: order.taskId
                                }
                            })
                            .then(() => cb(), cb);
                    }

                    /**
                      * Task handling for SUPPLY (1) Listings
                      * Task remains in the pool of active listings
                      */
                    if (Number(taskRef.taskType) === 2) {
                        return cb();
                    }
                }
                /**
                 * @configure-it end
                 */
            ], err => {
                if (err) {
                    return sendResponse(res, err);
                }

                sendResponse(res, null, createdOrder);

                // this goes to demand user
                orderEmitter
                    .emit("new-order", req.models, createdOrder.id);

                // this goes to supplier
                if (Number(taskRef.taskType) === 1) {
                    requestEmitter
                        .emit("request-accepted", req.models, createdOrder.requestId);
                }
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
                    .then(() => {
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
                .then(() => {
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
            .settleOrder(req.models, orderId, req.user.id, (err, order) =>
                sendResponse(res, err, order)
            );
        });
};