const async = require("async");
const resCtrl = require("../controllers/responseController.js");
const cust = require("../config/customizing.js");
const isLoggedIn = resCtrl.isLoggedIn;
const sendResponse = resCtrl.sendResponse;
const isLoggedInAndVerified = resCtrl.isLoggedInAndVerified;
const identifyUser = resCtrl.identifyUser;
const isAdmin = resCtrl.isAdmin;
const models  = require("../models/models");
const reviewEmitter = require("../events/review");

const RESOURCE = "review";

const REVIEW_TYPES = {
    ORDER: 1,
    REQUEST: 2
};

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

        if ([ "0", "1", "2", "3", "4", "5" ].indexOf(rate) === -1) {
            return res.status(400).send({
                code: "WRONG_RATE",
                desc: "Rate must be between 0 and 5"
            });
        }

        var order, request, task;

        async.waterfall([
            cb => {
                return req.models.review
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
                                code: "ALREADY_REVIEWED",
                                httpCode: 400,
                                desc: "You have already rated this order / request"
                            });
                        }

                        cb();
                    }, cb);
            },
            cb => {
                if (reviewType === REVIEW_TYPES.REQUEST) {
                    return cb();
                }

                req.models.order
                .findOne({
                    where: { 
                        id: orderId
                    },
                    include: [
                        { model: req.models.user },
                        { model: req.models.request },
                        { model: req.models.task }
                    ],
                })
                .then(rOrder => {
                    if (!rOrder) {
                        return cb({
                            code: "ORDER_NOT_FOUND",
                            desc: "Order has not been found",
                            httpCode: 400
                        });
                    }

                    order = rOrder;
                    request = rOrder.request;
                    task = rOrder.task;

                    if (
                        order.status !== req.models.order.ORDER_STATUS.SETTLED &&
                        order.status !== req.models.order.ORDER_STATUS.CLOSED
                    ) {
                        return cb({
                            httpCode: 400,
                            code: "WRONG_ORDER_STATUS_FOR_REVIEW",
                            desc: "Order needs to be completed to review it."
                        });
                    }

                    return cb();
                }, cb);
            },
            cb => {
                if (reviewType === REVIEW_TYPES.ORDER) {
                    return cb();
                }

                req.models.request
                .findOne({
                    where: { 
                        id: requestId
                    },
                    include: [
                        { model: req.models.order },
                        { model: req.models.task }
                    ],
                })
                .then(rRequest => {
                    if (!rRequest) {
                        return cb({
                            code: "REQUEST_NOT_FOUND",
                            desc: "Request has not been found",
                            httpCode: 400
                        });
                    }

                    request = rRequest;
                    order = rRequest.order;
                    task = rRequest.task;

                    if (
                        request.status !== req.models.request.REQUEST_STATUS.SETTLED &&
                        request.status !== req.models.request.REQUEST_STATUS.CLOSED
                    ) {
                        return cb({
                            httpCode: 400,
                            code: "WRONG_REQUEST_STATUS_FOR_REVIEW",
                            desc: "Request needs to be completed to review it."
                        });
                    }

                    return cb();
                }, cb);
            },
            cb => {             

                const toUserId = reviewType === REVIEW_TYPES.ORDER ? 
                    Number(task.taskType) === 1 ?
                        request.fromUserId : request.toUserId
                        : 
                    Number(task.taskType) === 1 ?
                        request.toUserId : request.fromUserId

                if (toUserId === userId) {
                    return cb({
                        code: "WRONG_REVIEW_SIDE",
                        desc: "You cannot leave review to yourself"
                    });
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

                return req.models.review
                .create(newReview)
                .then(rReview => {
                    return cb(null, rReview);
                }, cb);
            }
            ], (err, rReview) => {
                if (err) {
                    console.error(err);

                    return res
                    .status(400)
                    .send(err);
                }

                res.send(rReview);

                reviewEmitter.emit("review-left", req.models, rReview.id);
            });
    });

	app.get("/api/review", identifyUser, (req, res) => {
        const toUserId = Number(req.query.toUserId);

        if (!toUserId) {
            return res.status(400).send({
                code: "MISSING_QUERY",
                desc: "Specify query param \"toUserId\"",
            });
        }

        req.models.review
            .findAll({
                order: [[ "createdAt", "DESC" ]],
                where: {
                    toUserId
                },
                include: [
                    {   
                        model: req.models.user,
                        as: "fromUser"  
                    },
                    { model: req.models.task }
                ]
            })
            .then(reviews => {
                async.eachSeries(reviews, (review, cb) => {
                    req.models.review
                        .findOne({
                            where: {
                                $and: [
                                    { taskId: review.taskId },
                                    { fromUserId: review.toUserId },
                                ]
                            }
                        })
                        .then(oppositeReview => {

                            req.models
                                .appConfig
                                .findAll({
                                    $where: {
                                        $or: [
                                            { fieldKey: "LISTING_TASK_WORKFLOW_FOR_SUPPLY_LISTINGS" },
                                            { fieldKey: "LISTING_TASK_WORKFLOW_FOR_DEMAND_LISTINGS" },
                                            { fieldKey: "LISTING_TASK_WORKFLOW_FOR_SUPPLY_LISTINGS_REVIEW_STEP_ENABLED" },
                                            { fieldKey: "LISTING_TASK_WORKFLOW_FOR_DEMAND_LISTINGS_REVIEW_STEP_ENABLED" },
                                            { fieldKey: "LISTING_TASK_WORKFLOW_FOR_SUPPLY_LISTINGS_REVIEW_STEP_REQUIRE_BOTH_REVIEWS" },
                                            { fieldKey: "LISTING_TASK_WORKFLOW_FOR_DEMAND_LISTINGS_REVIEW_STEP_REQUIRE_BOTH_REVIEWS" },
                                        ]
                                    }
                                })
                                .then(rWorkflowConfigs => {

                                    const supplyWorkflow = rWorkflowConfigs
                                        .find(_ => _.fieldKey === "LISTING_TASK_WORKFLOW_FOR_SUPPLY_LISTINGS");

                                    const demandWorkflow = rWorkflowConfigs
                                        .find(_=> _.fieldKey === "LISTING_TASK_WORKFLOW_FOR_DEMAND_LISTINGS");

                                    const supplyWorkflowRequestsEnabled = rWorkflowConfigs
                                        .find(_ => _.fieldKey === "LISTING_TASK_WORKFLOW_FOR_SUPPLY_LISTINGS_REVIEW_STEP_ENABLED");

                                    const demandWorkflowRequestsEnabled = rWorkflowConfigs
                                        .find(_ => _.fieldKey === "LISTING_TASK_WORKFLOW_FOR_DEMAND_LISTINGS_REVIEW_STEP_ENABLED");

                                    const supplyWorkflowRequestsRequireBothSides = rWorkflowConfigs
                                        .find(_ => _.fieldKey === "LISTING_TASK_WORKFLOW_FOR_SUPPLY_LISTINGS_REVIEW_STEP_REQUIRE_BOTH_REVIEWS");

                                    const demandWorkflowRequestsRequireBothSides = rWorkflowConfigs
                                        .find(_ => _.fieldKey === "LISTING_TASK_WORKFLOW_FOR_DEMAND_LISTINGS_REVIEW_STEP_REQUIRE_BOTH_REVIEWS");

                                    if (
                                        oppositeReview ||
                                        (
                                            req.user &&
                                            review.fromUserId === req.user.id
                                        ) ||
                                        (
                                            (
                                                supplyWorkflow && String(supplyWorkflow.fieldValue) === "1"
                                            ) ||
                                            (
                                                demandWorkflow && String(demandWorkflow.fieldValue) === "1"
                                            )
                                        )
                                    ) {
                                        if (oppositeReview) {
                                            review.dataValues.hasOppositeReview = true;
                                        }
                                        if (req.user && review.fromUserId === req.user.id) {
                                            review.dataValues.isOwnReview = true;
                                        }

                                        if (
                                            (
                                                (
                                                    supplyWorkflowRequestsEnabled &&
                                                    String(review.task.taskType) === "2" &&
                                                    String(supplyWorkflowRequestsEnabled.fieldValue) === "1" &&
                                                    String(supplyWorkflowRequestsRequireBothSides.fieldValue) === "1"
                                                ) ||
                                                (
                                                    demandWorkflowRequestsEnabled &&
                                                    String(review.task.taskType) === "1" &&
                                                    String(demandWorkflowRequestsEnabled.fieldValue) === "1" &&
                                                    String(demandWorkflowRequestsRequireBothSides.fieldValue) === "1"
                                                ) 
                                            ) &&
                                            (
                                                !oppositeReview
                                            )
                                        ) {
                                            review.dataValues.hiddenByWorkflow = true;
                                        }
        
                                        return cb();
                                    }

                                    return cb();
        
                                    
                                }, cb);
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
