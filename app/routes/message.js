var async = require("async");
var responseController = require("../controllers/responseController");
var EmailService = require("../services/emailService");
const _ = require("underscore");

var isLoggedIn = responseController.isLoggedIn;

const requestEmitter = require("../events/request.js");
const models  = require("../models/models");

module.exports = app => {
   
    /**
     * Send message
     */
    app.post("/api/request/:requestId/message", isLoggedIn, (req, res) => {
        let message = String(req.body.message);

        try {
            message = message
            .split("<p><br></p>")
            .filter(_ => _ !== "<p><br></p>")
            .join("")
            .replace(/(\r\n|\n|\r)/gm, "");
        } catch(err) {
            console.error(err);

            message = "";
        }
        
        if (!message || message.length === 0) {
            return res.status(400).send("EMPTY_MESSAGE");
        }

        req.models.message
        .create({
            requestId: req.params.requestId,
            taskId: req.body.taskId,
            fromUserId: req.user.id,
            toUserId: req.body.toUserId,
            message
        })
        .then(rMessage => {

            requestEmitter
                .emit("message-received", req.models, rMessage.id);

            return res.send(rMessage);
        }, err => res.status(400).send(err));
    });

    const getMessages = (models, userId, requestId, groupBy) => new Promise((resolve, reject) => {
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
            .findAll({
                where,
                order: [ [ "createdAt", "DESC" ]]
            })
            .then(messages => {
                if (groupBy) {
                    messages = _.groupBy(messages, groupBy);
                }

                return resolve(messages);
            }, reject);
    });

    app.get("/api/message", isLoggedIn, (req, res) =>
        getMessages(req.models, req.user.id, req.query.request_id, req.query.group_by)
        .then(data => res.send(data), err => res.status(400).send(err))
    );

    /**
     * Gets message exchange for an application
     */
	app.get("/api/request/:requestId", isLoggedIn, (req, res) => {
        const requestId = Number(req.params.requestId);
        const result = { 
            users: {}
        };
        var request;

        async.waterfall([
            callback => req.models.request
                .findOne({
                    where: {
                        id: requestId
                    },
                    include: [
                        {
                            model: req.models.order,
                            include: [
                                {
                                    model: req.models.review
                                }
                            ]
                        },
                        {
                            model: req.models.review
                        },
                        {
                            model: req.models.user,
                            as: "fromUser"
                        },
                        { 
                            model: req.models.user,
                            as: "toUser"
                        }
                    ]
                })
                .then(rRequest => {
                    if (!rRequest) {
                        return callback({
                            code: "REQUEST_NOT_FOUND",
                            httpCode: 400,
                            desc: "Request not found"
                        });
                    }

                    request = rRequest;

                    result.request = request;

                    callback();
                }, callback),
            callback => getMessages(req.models, req.user.id, requestId)
                .then(messages => {
                    result.messages = messages;

                    return callback();
                }),
            callback => req.models.user.findOne({
                where: {
                    id: result.messages[0].fromUserId
                }
            })
            .then(user => {
                result.users[result.messages[0].fromUserId] = user;

                return callback();
            }),
            callback => req.models.user.findOne({ 
                where: {
                    id: result.messages[0].toUserId
                }
            }).then(user => {
                result.users[result.messages[0].toUserId] = user;

                return callback();
            }),
            callback => {
                req.models.task.findOne({
                    where: {
                        id: request.taskId
                    },
                    include: [
                        { model: req.models.taskTiming },
                        { model: req.models.taskLocation }
                    ]
                }).then(task => {
                    result.task = task;

                    return callback();
                }, err => callback(err));
            },
            callback => getMessages(req.models, req.user.id, requestId)
                        .then(messages => {
                            result.messages = messages;

                            return callback();
                        })
        ], err => responseController.sendResponse(res, err, result));
    });
};

