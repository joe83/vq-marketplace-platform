var async = require("async");
var responseController = require("../controllers/responseController");
var EmailService = require("../services/emailService");
const _ = require('underscore');

var isLoggedIn = responseController.isLoggedIn;

const requestEmitter = require("../events/request.js");
const models  = require('../models/models');

module.exports = app => {
   
    /**
     * Create request and sends message
     */       
    app.post("/api/request", isLoggedIn, (req, res) => {
        models.request
            .create({
                status: 0,
                taskId: req.body.taskId,
                fromUserId: req.user.id,
                toUserId: req.body.toUserId
            })
            .then(request => models.message.create({ 
                requestId: request.id,
                taskId: req.body.taskId,
                fromUserId: req.user.id,
                toUserId: req.body.toUserId,
                message: req.body.message
            }, err => res.status(400).send(err)))
            .then(message => new Promise(resolve => resolve(res.send(message))), err => res.status(400).send(err))
            .then(() => requestEmitter.emit('new-request', req.body.taskId, req.user.id, req.body.message))
    });

    /**
     * Send message
     */
    app.post("/api/request/:requestId/message", isLoggedIn, (req, res) => models.message.create({
            requestId: req.params.requestId,
            taskId: req.body.taskId,
            fromUserId: req.user.id,
            toUserId: req.body.toUserId,
            message: req.body.message
        })
        .then(message => new Promise(resolve => {
            res.send(message);

            return resolve(message);
        })
        .then(message => {
            // requestEmitter.emit('new-request-message', String(req.user._id), req.body.toUserId, req.body.taskId, message);
        }, err => res.status(400).send(err)
        )));

    const getMessages = (userId, requestId, groupBy) => new Promise((resolve, reject) => {
        const $orArr = [
            { fromUserId: userId },
            { toUserId: userId }
        ];
        const $andArr = [
            { $or: $orArr }
        ];

        if (requestId) {
            $andArr.push({
                requestId: Number(requestId)
            });
        }

        const where = { 
            $and: $andArr
        };

        if (requestId) {
            $andArr.push({
                $and: [ { requestId: Number(requestId) } ]
            });     
        }

        models.message
            .findAll({ where })
            .then(messages => {
                if (groupBy) {
                    messages = _.groupBy(messages, groupBy);
                }

                return resolve(messages);
            }, reject);
    });

    app.get("/api/message", isLoggedIn, (req, res) =>
        getMessages(req.user.id, req.query.request_id, req.query.group_by)
        .then(data => res.send(data), err => res.status(400).send(err))
    );

    /**
     * Gets message exchange for an application
     */
	app.get("/api/request/:requestId", isLoggedIn, (req, res) => {
        const requestId = Number(req.params.requestId);
        const result = { users: {} };

        async.waterfall([
            callback => getMessages(req.user.id, requestId)
                .then(messages => {
                    result.messages = messages;

                    return callback();
                }),
            callback => models.user.findOne({
                where: {
                    id: result.messages[0].fromUserId
                }
            })
            .then(user => {
                result.users[result.messages[0].fromUserId] = user;

                return callback();
            }),
            callback => models.user.findOne({ 
                where: {
                    id: result.messages[0].toUserId
                }
            }).then(user => {
                result.users[result.messages[0].toUserId] = user;

                return callback();
            }),
            callback => models.request.findOne({
                where: {
                    id: requestId
                }
            })
            .then(request => callback(null, request)),
            (request, callback) => {
                result.request = request;

                models.task.findOne({
                    where: {
                        id: request.taskId
                    }
                }).then(task => {
                    result.task = task;

                    return callback();
                }, err => callback(err));
            },
            callback => getMessages(req.user.id, requestId)
                        .then(messages => {
                            result.messages = messages;

                            return callback();
                        })
        ], err => responseController.sendResponse(res, err, result));
    });
};

