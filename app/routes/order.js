const async = require('async');
const responseController = require("../controllers/responseController");
const models = require('../models/models');
const isLoggedIn = responseController.isLoggedIn;
const sendResponse = responseController.sendResponse;
const orderEmitter = require("../events/order");
const requestEmitter = require("../events/request");
const orderCtrl = require("../controllers/orderCtrl");
const RESOURCE = 'order';

module.exports = app => {
    app.post(`/api/${RESOURCE}`,
        isLoggedIn,
        (req, res) => {
            const order = req.body;
            var createdOrder;

            order.userId = req.user.id;
            order.status = models.order.ORDER_STATUS.PENDING;

            async.waterfall([
                cb => models.order
                    .create(order)
                    .then(rCreatedOrder => {
                        createdOrder = rCreatedOrder;

                        cb();
                    }, cb),
                cb => models.request
                    .update({
                        status: models.request.REQUEST_STATUS.ACCEPTED
                    }, {
                        where: {
                            id: order.requestId
                        }
                    })
                    .then(() => cb(), cb),
                cb => models.task
                    .update({
                        status: models.task.TASK_STATUS.BOOKED
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
                    .emit('new-order', createdOrder.id);

                requestEmitter
                    .emit('request-accepted', createdOrder.requestId);
            })
        });

    app.get(`/api/${RESOURCE}/:${RESOURCE}Id`,
        isLoggedIn,
        (req, res) => {
            const orderId = req.params.orderId;
            const userId = req.user.id;
            const where = {
                $and: [
                    { userId },
                    { id: orderId  }
                ]
            };

            models.order
            .findOne({
                where,
                include: [
                    {
                        model: models.user
                    },
                    {
                        model: models.request,
                    },
                    {
                        model: models.task
                    },
                    {
                        model: models.review
                    }
                ]
            })
            .then(order => {
                return sendResponse(res, null, order);
            }, err => sendResponse(res, err));
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

            if (req.query.view === 'in_progress') {
                where.$and.push({
                    $or: [
                        { status: models.order.ORDER_STATUS.PENDING },
                        { status: models.order.ORDER_STATUS.MARKED_DONE }
                    ]
                });
            }

            if (req.query.view === 'completed') {
                where.$and.push({
                    $or: [
                        {
                            status: models.order.ORDER_STATUS.SETTLED
                        }
                    ]
                });
            }

            models.order
            .findAll({
                where,
                include: [
                    {
                        model: models.user
                    },
                    {
                        model: models.request,
                    },
                    {
                        model: models.task
                    },
                    {
                        model: models.review
                    }
                ]
            })
            .then(orders => {
                orders = orders
                    .filter(order => order.request);
                
                async
                    .eachLimit(orders, 3, (order, cb) => {
                        const fromUserId = order.request.fromUserId;
                        
                        models.user.findOne({
                            where: {
                                id: fromUserId
                            },
                            include: [
                                {
                                    model: models.userProperty
                                }
                            ]
                        })
                        .then(user => {
                            order = order.dataValues;
                            order.fromUser = user.dataValues;

                            cb();
                        }, cb);
                    }, err => {
                        sendResponse(res, err, orders);
                    });
            })
            .catch(err => sendResponse(res, err));
        });

    /**
     * Settles the order and the underlying request
     */
    app.put('/api/order/:orderId',
        isLoggedIn,
        (req, res) => {
        var orderId = req.params.orderId;
        
        orderCtrl.settleOrder(orderId, req.user.id, (err, order) => {
            sendResponse(res, err, order);
        });
    });
};