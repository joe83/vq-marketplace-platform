const async = require('async');
const resCtrl = require("../controllers/responseController.js");
const cust = require("../config/customizing.js");
const isLoggedIn = resCtrl.isLoggedIn;
const sendResponse = resCtrl.sendResponse;
const isLoggedInAndVerified = resCtrl.isLoggedInAndVerified;
const isAdmin = resCtrl.isAdmin;
const models  = require('../models/models');
const reviewEmitter = require("../events/review");

const RESOURCE = 'review';

const REVIEW_TYPES = {
    ORDER: 1,
    REQUEST: 2
}

module.exports = app => {
    /**
     * @bodyParam taskId
     * @bodyParam body
     * @bodyParam rate
     */
    app.post(`/api/${RESOURCE}`, isLoggedIn, isLoggedInAndVerified, (req, res) => {
        const userId = req.user.id;
        
        
        const rate = String(req.body.rate);
        const body = req.body.body;

        var orderId, requestId, reviewType;
        const whereObj = {};

        if (req.body.orderId) {
            orderId = req.body.orderId;
            whereObj.orderId = orderId;
            reviewType = REVIEW_TYPES.ORDER;
        } else {
            requestId = req.body.requestId;
            whereObj.requestId = requestId;
            reviewType = REVIEW_TYPES.REQUEST;
        }

        if ([ '0', '1', '2', '3', '4', '5' ].indexOf(rate) === -1) {
            return res.status(400).send({
                code: 'WRONG_RATE',
                desc: 'Rate must be between 0 and 5'
            })
        }

        var order, request;

        async.waterfall([
            cb => {
                return models.review
                    .findOne({ 
                        where: {
                            $and: [
                                {
                                    fromUserId: userId
                                },
                                whereObj
                            ]
                        }
                    })
                    .then(review => {
                        if (review) {
                            return cb({
                                code: 'ALREADY_REVIEWED',
                                httpCode: 400,
                                desc: 'You have already rated this order / request'
                            });
                        }

                        cb();
                    }, cb);
            },
            cb => {
                if (reviewType === REVIEW_TYPES.REQUEST) {
                    return cb();
                }

                models.order
                .findOne({
                    where: { 
                        id: orderId
                    },
                    include: [
                        { model: models.user },
                        { model: models.request },
                        { model: models.task }
                    ],
                })
                .then(rOrder => {
                    if (!rOrder) {
                        return cb({
                            code: 'ORDER_NOT_FOUND',
                            desc: 'Order has not been found',
                            httpCode: 400
                        });
                    }

                    order = rOrder;
                    request = rOrder.request;

                    if (
                        order.status !== models.order.ORDER_STATUS.SETTLED &&
                        order.status !== models.order.ORDER_STATUS.CLOSED
                    ) {
                        return cb({
                            httpCode: 400,
                            code: 'WRONG_ORDER_STATUS_FOR_REVIEW',
                            desc: 'Order needs to be completed to review it.'
                        })
                    }

                    return cb();
                }, cb)
            },
            cb => {
                if (reviewType === REVIEW_TYPES.ORDER) {
                    return cb();
                }

                models.request
                .findOne({
                    where: { 
                        id: requestId
                    },
                    include: [
                        { model: models.order }
                    ],
                })
                .then(rRequest => {
                    if (!rRequest) {
                        return cb({
                            code: 'REQUEST_NOT_FOUND',
                            desc: 'Request has not been found',
                            httpCode: 400
                        });
                    }

                    request = rRequest;
                    order = rRequest.order;

                    if (
                        request.status !== models.request.REQUEST_STATUS.SETTLED &&
                        request.status !== models.request.REQUEST_STATUS.CLOSED
                    ) {
                        return cb({
                            httpCode: 400,
                            code: 'WRONG_REQUEST_STATUS_FOR_REVIEW',
                            desc: 'Request needs to be completed to review it.'
                        })
                    }

                    return cb();
                }, cb)
            },
            cb => {
                const toUserId = reviewType === REVIEW_TYPES.ORDER ? order.request.fromUserId : request.toUserId;

                if (toUserId === userId) {
                    return cb({
                        code: 'WRONG_REVIEW_SIDE',
                        desc: 'You cannot leave review to yourself'
                    })
                }

                const newReview = {
                    body,
                    rate,
                    fromUserId: userId,
                    toUserId: toUserId,
                    taskId: order.taskId,
                };

                if (reviewType === REVIEW_TYPES.ORDER) {
                    newReview.orderId = orderId;
                }

                if (reviewType === REVIEW_TYPES.REQUEST) {
                    newReview.requestId = request.id;
                }

                return models.review
                .create(newReview)
                .then(rReview => {
                    return cb(null, rReview);
                }, cb)
            }
            ], (err, rReview) => {
                if (err) {
                    console.error(err);

                    return res
                    .status(400)
                    .send(err)
                }

                res.send(rReview);

                reviewEmitter.emit('review-left', rReview.id);
            });
    });

	app.get("/api/review", (req, res) => {
        const toUserId = Number(req.query.toUserId);

        if (!toUserId) {
            return res.status(400).send({
                code: 'MISSING_QUERY',
                desc: 'Specify query param "toUserId"',
            })
        }

        models.review
            .findAll({
                where: { 
                    toUserId
                },
                include: [
                    {   
                        model: models.user,
                        as: 'fromUser'  
                    },
                    { model: models.task }
                ]
            })
            .then(reviews => {
                async.eachSeries(reviews, (review, cb) => {
                    models.review
                        .findOne({
                            where: {
                                $and: [
                                    { taskId: review.taskId },
                                    { fromUserId: review.toUserId },
                                ]
                            }
                        })
                        .then(oppositeReview => {
                            if (oppositeReview) {
                                review.dataValues.canBeShown = true;

                                return cb();
                            }

                            delete review.dataValues.rate;
                            delete review.dataValues.body;

                            review.dataValues.body;
                            
                            return cb();
                        });
                }, () => {
                    res.send(reviews);
                }, err => {
                    res
                        .status(400)
                        .send(err);
                });
            }, err => {
                console.log(err);

                res
                    .status(400)
                    .send(err);
            });
        });
};
