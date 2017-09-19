const async = require('async');
const resCtrl = require("../controllers/responseController.js");
const cust = require("../config/customizing.js");
const isLoggedIn = resCtrl.isLoggedIn;
const sendResponse = resCtrl.sendResponse;
const isLoggedInAndVerified = resCtrl.isLoggedInAndVerified;
const isAdmin = resCtrl.isAdmin;
const models  = require('../models/models');
const requestCtrl = require("../controllers/requestCtrl");
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

                    return cb();
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
                $and: [
                    {
                        $or: [
                            { status: models.request.REQUEST_STATUS.PENDING },
                            { status: models.request.REQUEST_STATUS.ACCEPTED },
                            { status: models.request.REQUEST_STATUS.MARKED_DONE },
                            { status: models.request.REQUEST_STATUS.SETTLED }
                        ]
                    }, {
                        $or: [
                            {
                                fromUserId: userId
                            }, {
                                toUserId: userId
                            }
                        ]
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

        if (req.query.userId) {
            where.$and.push({
                userId: req.query.userId
            });
        }

        models.request
            .findAll({
                where,
                order: [[ 'createdAt', 'DESC' ]],
                include: [
                    { model: models.review },
                    { model: models.order }
                ]
            })
            .then(data => async
                .forEachLimit(data, 5, (item, cb) => {
                async.waterfall([
                    cb => models.message
                    .findOne({
                        where: {
                            requestId: item.id
                        },
                        order: [[ 'createdAt', 'DESC' ]]
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
                    const data = {};

                    async.parallel([
                        cb => {
                            models.task.findOne({
                                where: {
                                    id: item.taskId
                                },
                                include: [
                                    { model: models.taskTiming },
                                    { model: models.taskLocation },
                                ]
                            })
                            .then(task => {
                                data.task = task;

                                return cb();
                            }, cb);
                        },
                        cb =>
                            models.taskCategory
                            .findAll({
                                where: {
                                    taskId: item.taskId
                                }
                            })
                            .then(categories => {
                                data.categories = categories;

                                return cb(null, categories);
                            }, cb)
                    ], err => {
                        if (err) {
                            return cb(err);
                        }


                        data.task.dataValues.categories = data.categories;

                        item.dataValues.task = data.task;

                        return cb();
                    });
                }
            ], cb);
            }, err => err ? res.status(500).send(err) : res.send(data)))
            .catch(err => {
                res
                    .status(500)
                    .send(err);
            });
    });

    app.put('/api/request/:requestId', isLoggedIn, (req, res) => {
        const newStatus = String(req.body.status);
        const userId = req.user.id;
        const requestId = req.params.requestId;
       
        requestCtrl
            .changeRequestStatus(requestId, newStatus, userId, (err, request) =>{
                return sendResponse(res, err, request);
            });
    });

    app.get('/api/request/:requestId/order', isLoggedIn, (req, res) => {
        const requestId = req.params.requestId;

        models.order
            .findOne({
                requestId: req.params.requestId
            })
            .then(order => {
                sendResponse(res, null, order);
            }, err => sendResponse(res, err));
    });

    app.get('/api/order/:orderId/request', isLoggedIn, (req, res) => {
        const orderId = req.params.orderId;

        models.order
            .findById(orderId)
            .then(order => {
                models.request
                .findById(order.requestId)
                .then(request => {
                    return sendResponse(res, null, request);
                }, err => sendResponse(res, err))
            }, err => sendResponse(res, err))
    });
};
