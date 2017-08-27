const async = require('async');
const resCtrl = require("../controllers/responseController.js");
const cust = require("../config/customizing.js");
const isLoggedIn = resCtrl.isLoggedIn;
const sendResponse = resCtrl.sendResponse;
const isLoggedInAndVerified = resCtrl.isLoggedInAndVerified;
const isAdmin = resCtrl.isAdmin;
const models  = require('../models/models');
const requestEmitter = require("../events/request");
const orderEmitter = require("../events/order");

module.exports = app => {
    app.post("/api/request", isLoggedIn, isLoggedInAndVerified, (req, res) => {
        const message = req.body.message;
        const taskId = req.body.taskId;
        const fromUserId = req.user.id;
        var task, toUserId, request;

        async.waterfall([
            cb => models.task
                .findById(taskId)
                .then(rTask => {
                    task = rTask;
                    toUserId = rTask.userId;

                    if (!task) {
                        return cb({
                            code: 400
                        });
                    }

                    cb();
                }, cb),
            cb => models.request
                .create({
                    status: models.request.REQUEST_STATUS.PENDING,
                    taskId,
                    fromUserId,
                    toUserId
                })
                .then(rRequest => {
                    request = rRequest;

                    models.message.create({
                        requestId: request.id,
                        taskId,
                        fromUserId,
                        toUserId,
                        message
                    })
                    .then(rMessage => {
                        cb(null, rMessage);
                    }, cb)
                })
            ], (err, rMessage) => {
                if (err) {
                    return res.status(400).send(err)
                }

                res.send(rMessage);

                requestEmitter.emit('new-request', request.id);
            });
        });

	app.get("/api/request", isLoggedIn, (req, res) => {
        const userId = req.user.id;

        const where = {
            $and: [{
                $or: [
                    {
                        fromUserId: userId
                    }, {
                        toUserId: userId
                    }
                ]
            }]
        };

        if (req.query.view === 'in_progress') {
            where.$and.push({ $or: [
                { status: models.request.REQUEST_STATUS.ACCEPTED },
                { status: models.request.REQUEST_STATUS.MARKED_DONE }
            ]});
        }

        if (req.query.view === 'pending') {
            where.$and.push({ 
                $or: [
                    { status: models.request.REQUEST_STATUS.PENDING }
                ]
            });
        }

        if (req.query.view === 'completed') {
            where.$and.push({
                $or: [{
                    status: models.request.REQUEST_STATUS.SETTLED
                }]
            });
        }

        models.request
            .findAll({
                where,
                include: [
                    { model: models.review }
                ]
            })
            .then(data => async
                .forEachLimit(data, 5, (item, cb) => {
                async.waterfall([
                    cb => models.message
                    .findOne({
                        where: {
                            requestId: item.id
                        }
                    })
                    .then(msg => {
                        try {
                            item.dataValues.lastMsg = msg;
                        } catch (err){

                        }

                        cb();
                    }, cb),
                    cb => {
                        const fromUserId = item.dataValues.lastMsg.fromUserId;
                        const toUserId = item.dataValues.lastMsg.toUserId;

                        models.user.findOne({
                            where: {
                                id: fromUserId === req.user.id ? toUserId : fromUserId 
                            },
                            include: [{
                                model: models.userProperty
                            }]
                        }).then(user => {
                            item.dataValues.with = user;

                            cb();
                    });
                },
                cb => {
                    models.task.findOne({
                        where: {
                            id: item.taskId
                        },
                        include: [
                            { model: models.taskTiming }
                        ]
                    }).then(task => {
                        item.dataValues.task = task;

                        cb();
                    });
                }], cb)
            }, err => err ? res.status(500).send(err) : res.send(data)))
            .catch(err => {
                res.status(500).send(err)
            });
    });

    app.put('/api/request/:requestId', isLoggedIn, (req, res) => {
        const newStatus = String(req.body.status);
        const userId = req.user.id;
        const requestId = req.params.requestId;
        var request;

        async.waterfall([
            cb => models.request
                .update({
                    status: newStatus
                }, {
                    where: {
                        id: Number(req.params.requestId),
                        fromUserId: userId
                    }
                })
                .then(rRequest => {
                    request = rRequest;

                    cb();
                }, cb),
            cb => {
                if (newStatus !== models.request.REQUEST_STATUS.MARKED_DONE) {
                    return cb();
                }

                if (newStatus === models.request.REQUEST_STATUS.MARKED_DONE) {
                       models.order
                        .update({
                            status: models.order.ORDER_STATUS.MARKED_DONE
                        }, {
                            where: {
                                requestId: requestId
                            }
                        })
                        .then(() => cb(), cb)
                }
            }
        ], err => {
            sendResponse(res, err);

            if (newStatus === models.request.REQUEST_STATUS.MARKED_DONE) {
                requestEmitter
                    .emit('request-marked-as-done', requestId);

                orderEmitter
                    .emit('order-marked-as-done', request.orderId)
            }
        });
    });
};
