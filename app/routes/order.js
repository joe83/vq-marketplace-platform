const async = require('async');
const responseController = require("../controllers/responseController");
const models = require('../models/models');
const isLoggedIn = responseController.isLoggedIn;
const sendResponse = responseController.sendResponse;

const RESOURCE = 'order';

module.exports = app => {
    app.post(`/api/${RESOURCE}`,
        isLoggedIn,
        (req, res) => {
            const order = req.body;
            var createdOrder = null;

            order.userId = req.user.id;

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
                    .then(() => cb(), cb)
            ], err => {
                sendResponse(res, err, createdOrder);
            })
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
                    }
                ]
            })
            .then(orders => {
                orders = orders.filter(order => order.request);
                
                async.eachLimit(orders, 3, (order, cb) => {
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
                })
            })
            .catch(err => sendResponse(res, err));
        });

    /**
     * Settles the order and the underlying request
     */
    app.put('/api/order/:orderId',
        isLoggedIn,
        (req, res) =>
        async.waterfall([
            cb => models.order
                .update({
                    status: models.order.ORDER_STATUS.SETTLED
                }, {
                    where: {
                        id: req.params.orderId
                    }
                })
                .then(order => {
                    models.order
                    .findById(req.params.orderId)
                    .then(order => {
                        cb(null, order.requestId)
                    }, cb);
                }, cb),
            (requestId, cb) => {
                models.request
                .update({
                    status: models.request.REQUEST_STATUS.SETTLED
                }, {
                    where: {
                        id: requestId
                    }
                })
                .then(() => cb(), cb)
            }
        ], err => {
            responseController.sendResponse(res, err)
        })
    );
};