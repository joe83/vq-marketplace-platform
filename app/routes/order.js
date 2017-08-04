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

            order.userId = req.user.id;

            models.order
                .create(order)
                .then(data => sendResponse(res, null, data))
                .catch(err => sendResponse(res, err));
        });

    app.get(`/api/${RESOURCE}`,
        isLoggedIn,
        (req, res) => {
            const userId = req.user.id;

            models.order
            .findAll({
                where: {
                    userId: userId
                },
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

    app.put('/api/order/:orderId', isLoggedIn, (req, res) => {
        models.order
            .update({
                status: 10
            }, {
                where: {
                    id: req.params.orderId
                }
            })
            .then(
                data => responseController.sendResponse(res, null, data), 
                err => responseController.sendResponse(res, err)
            );
    });
};