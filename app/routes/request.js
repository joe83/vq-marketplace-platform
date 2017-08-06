const resCtrl = require("../controllers/responseController.js");
const cust = require("../config/customizing.js");
const isLoggedIn = resCtrl.isLoggedIn;
const sendResponse = resCtrl.sendResponse;
const isAdmin = resCtrl.isAdmin;
const models  = require('../models/models');
const async = require('async');

module.exports = app => {
    /*
        app.get("/api/request", isLoggedIn, (req, res) => {
            models.request
                .findAll({ where: {
                    ownerUserId: req.user.id
                }})
                .then(data => {
                    res.send(data)
                })
                .catch(err => {
                    res.status(500).send(err)
                });
        });
    */

	app.get("/api/request", isLoggedIn, (req, res) => {
        const userId = req.user.id;

        models.request
            .findAll({
                where: {
                    $or: [
                        {
                            fromUserId: userId
                        }, {
                            toUserId: userId
                        }
                    ]
                }
            })
            .then(data => async.forEachLimit(data, 5, (item, cb) => {
                async.waterfall([
                    cb => models.message.findOne({
                        where: {
                            requestId: item.id
                        }
                    }).then(msg => {
                        item.dataValues.lastMsg = msg;

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
                        }
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
        const requestId = req.params.requestId;

        async.waterfall([
            cb => models.request
                .update({
                    status: newStatus
                }, {
                    where: {
                        id: Number(req.params.requestId),
                        fromUserId: req.user.id
                    }
                })
                .then(() => cb(), cb),
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
        ], err => sendResponse(res, err));
    });
};
