const async = require("async");
const sendResponse = require("../controllers/responseController.js").sendResponse;
const identifyUser = require("../controllers/responseController.js").identifyUser;
const isLoggedIn = require("../controllers/responseController.js").isLoggedIn;
const requestCtrl = require("../controllers/requestCtrl.ts");
const isLoggedInAndVerified = require("../controllers/responseController.js").isLoggedInAndVerified;
const taskEmitter = require("../events/task");

const isMyTask = (models, taskId, myUserId) => {
    return models
    .task
    .findOne({
        where: [
            { id: taskId }
        ]
    })
    .then(task => new Promise((resolve, reject) => {
        if (!task) {
            return reject({
                status: 400, 
                code: "TASK_DOES_NOT_EXIST" 
            });
        }

        if (Number(task.userId) !== Number(myUserId)) {
            return reject({ 
                status: 401, 
                code: "NOT_YOUR_TASK" 
            });
        }

        return resolve(task);
    }));
};

const getTaskAdditionalInfo = (models, taskId) => new Promise((resolve, reject) => async.parallel([
    cb => 
        models.taskCategory
        .findAll({
            where: { taskId: taskId }
        })
        .then(categories => cb(null, categories), err => cb(err)),
    cb => 
        models.taskImage
        .findAll({
            where: { taskId: taskId }
        })
        .then(images => cb(null, images), err => cb(err)),
    cb => 
        models.taskLocation
        .findOne({
            where: { taskId: taskId }
        })
        .then(location => cb(null, location), err => cb(err))
], (err, data) => {
    if (err) {
        return reject(err);
    }

    const task = {};

    task.categories = JSON.parse(JSON.stringify(data[0]));
    task.images = JSON.parse(JSON.stringify(data[1]));
    task.location = JSON.parse(JSON.stringify(data[2]));

    return resolve(task);
}));

module.exports = app => {
	app.get("/api/task",
        identifyUser, 
        (req, res) => {
            const query = {};

            query.order = [[
                "createdAt", "DESC"
            ]];

            query.include = [];

            query.include.push({
                model: req.models.request,
                include: [
                    { 
                        model: req.models.user,
                        as: "fromUser",
                    },
                    {
                        model: req.models.order
                    }
                ]
            },
            {
                    model: req.models.review
            });

            const timingInclude = {
                model: req.models.taskTiming,
            };

            if (req.query.untilNow) {
                const now = new Date(); 
                const nowUtc = new Date(
                    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()
                );

                timingInclude.where = {
                    endDate: {
                        $gte: nowUtc.getTime() / 1000
                    }
                };
            }
            
            query
            .include
            .push(timingInclude);
            
            if (req.query && req.query.category) {
                query.include.push(
                    { 
                        model: req.models.taskCategory,
                        where: {
                            code: req.query.category
                        }
                    }
                );

                delete req.query.category;
            }

            if (req.query) {
                query.where = {};
                query.where.$and = [];

                const lat = req.query.lat;
                const lng = req.query.lng;
                const rad = req.query.rad || 2000;

                if (lat && lng) {
                    const location = req.models.seq
                        .literal(`ST_GeomFromText('POINT(${lat} ${lng})')`);

                    const distance = req.models.seq
                        .fn("ST_Distance_Sphere", req.models.seq.literal("geo"), location);

                    /*
                    const attributes = Object
                        .keys(req.models.taskLocation.attributes);

                     attributes.push([
                        distance,
                        'distance'
                    ]);
                    */

                    const seqWhereCond = req.models
                        .seq
                        .where(distance, {
                            $lte: rad
                        });
                   
                    query.include.push({
                        model: req.models.taskLocation,
                        where: seqWhereCond
                    });
                } else {
                    query.include.push({
                        model: req.models.taskLocation
                    });
                }


                if (req.query.status) {
                    const statusQuery = [];
                    
                    if (Array.isArray(req.query.status)) {
                        req.query.status.forEach(status => statusQuery.push({ status: String(status) }));
                    } else {
                        statusQuery.push({ status: String(req.query.status) });
                    }
        
                    query.where.$and.push({ 
                        $or: statusQuery
                    });
                }
                
                if (req.query.userId) {
                    query.where.$and.push({
                        userId: req.query.userId
                    });
                }

                if (req.query.taskType) {
                    query
                        .where
                        .$and
                        .push({
                            taskType: req.query.taskType
                        });
                }

                if (req.query.minPrice || req.query.maxPrice) {
                    const minPrice = Number(req.query.minPrice);
                    const maxPrice = Number(req.query.maxPrice);

                    if (minPrice) {
                        query
                        .where
                        .$and
                        .push({
                            price: {
                                $gte: minPrice
                            }
                        });
                    }
                    
                    if (maxPrice) {
                        query
                            .where
                            .$and
                            .push({
                                price: {
                                    $lte: maxPrice
                                }
                            });
                    }
                }
            }

            return req.models.task
                .findAll(query)
                .then(rTasks => new Promise(
                    (resolve, reject) => {
                        const tasks = JSON.parse(JSON.stringify(rTasks));

                        req.models
                        .appTaskCategory
                        .findAll()
                        .then(categories => {
                            async.eachLimit(tasks, 5, (task, cb) => {
                                getTaskAdditionalInfo(req.models, task.id)
                                .then(taskAdditionalInfo => {
                                    task.categories = taskAdditionalInfo.categories;
                                    
                                    try {
                                        task.categories = task.categories
                                        .map(_ => {
                                            _.imageUrl = categories
                                                .find(category => category.code === _.code)
                                                .imageUrl;

                                            return _;
                                        });
                                    } catch (err) {
                                        console.error(err);
                                    }

                                    task.images = taskAdditionalInfo.images;
                                    task.location = taskAdditionalInfo.location;

                                    return cb();
                                }, cb);
                            }, err => {
                                if (err) {
                                    return reject(err);
                                }
    
                                return resolve(tasks);
                            });
                        });  
                    })
                )
                .then(
                    tasks =>  sendResponse(res, null, tasks),
                    err => {
                        sendResponse(res, err);
                    }
                );
            });

    app.get("/api/task/location/last",
        isLoggedIn, 
        (req, res) => {
            return req.models.taskLocation
                .findOne({
                    order: [[ "createdAt", "DESC" ]],
                    include: [
                        {
                            model: req.models.task,
                            include: [
                                {
                                    model: req.models.user,
                                    require: true
                                }
                            ]
                        }
                    ]
                })
                .then(lastLocation =>
                    sendResponse(res, null, lastLocation),
                    err => sendResponse(res, err)
                );
            });

    app.post("/api/task",
        isLoggedInAndVerified,
        (req, res) => {
            req.models.task
                .create({
                    status: req.models.task.TASK_STATUS.CREATION_IN_PROGRESS,
                    // supply listings are the defaults ones
                    taskType: req.user.userType === 1 ? 1 : 2,
                    userId: req.user.id
                })
                .then(task => sendResponse(res, null, task))
                .catch(err => sendResponse(res, err));
        });

    app.post("/api/task/:taskId/comment",
        isLoggedIn,
        (req, res) => {
            req.models.taskComment
            .create({
                comment: req.body.comment,
                userId: req.user.id,
                taskId: req.params.taskId
            })
            .then(data => sendResponse(res, null, data))
            .catch(err => sendResponse(res, err));
        });
        
   app.post("/api/task/:taskId/category",
        isLoggedIn,
        (req, res) => {
            isMyTask(req.models, req.params.taskId, req.user.id)
            .then(() => req.models.taskCategory.destroy({
                where: {
                    taskId: req.params.taskId
                }
            }))
            .then(() => new Promise((resolve, reject) => 
                async.each(req.body, (code, cb) => {
                    return req.models.taskCategory
                        .create({ code, taskId: req.params.taskId })
                        .then(() => cb(), err => cb(err));
                }, err => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve();
            })))
            .then(() => sendResponse(res, null, { ok: true }), err => sendResponse(res, err));
        });

   app.post("/api/task/:taskId/image",
        isLoggedIn,
        (req, res) => {
            isMyTask(req.models, req.params.taskId, req.user.id)
            .then(() => req.models.taskImage.destroy({
                where: {
                    taskId: req.params.taskId
                }
            }))
            .then(() => new Promise((resolve, reject) =>
                async.each(req.body, (image, cb) => {
                    return req.models.taskImage
                        .create({ imageUrl: image.imageUrl, taskId: req.params.taskId })
                        .then(() => cb(), err => cb(err));
                }, err => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve();
            })))
            .then(() => sendResponse(res, null, { ok: true }), err => sendResponse(res, err));
        });

    app.post("/api/task/:taskId/timing",
        isLoggedIn,
        (req, res) => {
            const taskId = req.params.taskId;

            isMyTask(req.models, req.params.taskId, req.user.id)
            .then(() => req.models.taskTiming.destroy({
                where: {
                    taskId
                }
            }))
            .then(() => new Promise((resolve, reject) => async
                .each(req.body.dates, (timing, cb) => {
                    timing.endDate = timing.endDate || timing.date;

                    return req.models.taskTiming
                        .create({
                            duration: req.body.duration,
                            date: timing.date,
                            endDate: timing.endDate,
                            type: "",
                            taskId
                        })
                        .then(() => cb(), err => cb(err));
                }, err => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve();
            })))
            .then(() => sendResponse(res, null, { ok: true }), err => sendResponse(res, err));
        });

   /*
    Updates location for a task
   */
   app.post("/api/task/:taskId/location",
        isLoggedIn,
        (req, res) => {
            const userId = req.user.id;
            const taskId = req.params.taskId;

            req.body.taskId = taskId;

            isMyTask(req.models, taskId, userId)
            .then(() => req.models.taskLocation.destroy({
                where: {
                    taskId
                }
            }))
            .then(() => new Promise((resolve, reject) => {
                req.models
                .taskLocation
                .findOne({
                    where: {
                        userId
                    }
                })
                .then(defaultLocation => {
                    const taskLocation = req.body;
                    const lat = taskLocation.lat;
                    const lng = taskLocation.lng;

                    const geoPoint = {
                        type: "Point",
                        coordinates: [
                            lat,
                            lng
                        ]
                    };

                    taskLocation.geo = geoPoint;

                    if (!defaultLocation) {
                        taskLocation.userId = userId;
                    }

                    return req.models
                        .taskLocation
                        .create(taskLocation)
                        .then(_ => {
                            resolve(_);
                        }, _ => {
                            reject(_);
                        });
                    });
            }))
            .then(taskLocation => {
                return sendResponse(res, null, taskLocation);
            })
            .catch(err => {
                return sendResponse(res, err);
            });
        });

    app.post("/api/task-location",
        isLoggedIn,
        (req, res) => {
            const userId = req.user.id;
            const taskLocation = req.body;
            const lat = taskLocation.lat;
            const lng = taskLocation.lng;

            const geoPoint = {
                type: "Point",
                coordinates: [
                    lat,
                    lng
                ]
            };

            taskLocation.geo = geoPoint;

            req.models
            .taskLocation
            .findOne({
                where: {
                    userId
                }
            })
            .then(taskLocationRef => {
                if (taskLocationRef) {
                    delete taskLocation.id;
                    delete taskLocation.createdAt;
                    delete taskLocation.updatedAt;
                    delete taskLocation.userId;

                    return taskLocationRef
                        .update(taskLocation)
                        .then(() => sendResponse(res, null, taskLocation), err => sendResponse(res, err));
                }
              
                return req.models
                    .taskLocation
                    .create({
                        userId,
                        countryCode: taskLocation.countryCode,
                        postalCode: taskLocation.postalCode,
                        city: taskLocation.city,
                        street: taskLocation.street,
                        streetNo: taskLocation.streetNo,
                        addressAddition: taskLocation.addressAddition,
                        taxNumber: taskLocation.taxNumber,
                        lat: taskLocation.lat,
                        lng: taskLocation.lng,
                        geo: taskLocation.geo
                    })
                    .then(_ => {
                        sendResponse(res, null, _);
                    }, err => {
                        sendResponse(res, err);
                    });
            });
        });

    app.get("/api/task-location", isLoggedIn, (req, res) => {
        return req.models
            .taskLocation
            .findAll({
                where: {
                    userId: req.user.id
                }
            })
            .then(locations =>
                sendResponse(res, null, locations),
                err => sendResponse(res, err)
            );
    });

   app.get("/api/task/:taskId", 
    identifyUser, 
    (req, res) => 
        async.parallel([
            cb => 
                req.models.task
                .findOne({
                    where: {
                        id: req.params.taskId
                    },
                    include: [{
                        model: req.models.user
                    }]
                })
                .then(task => {
                    if (!task) {
                        return cb({
                            code: "LISTING_NOT_FOUND"
                        });
                    }

                    return cb(null, task);
                }, cb),
            cb => 
                req.models.taskCategory
                .findAll({ 
                    where: {
                        taskId: req.params.taskId
                    }
                })
                .then(categories => cb(null, categories), err => cb(err)),
            cb => 
                req.models.taskImage
                .findAll({ where: { taskId: req.params.taskId } })
                .then(images => cb(null, images), err => cb(err)),
            cb => 
                req.models.taskLocation
                .findOne({ where: { taskId: req.params.taskId } })
                .then(location => cb(null, location), err => cb(err)),
            cb => 
                req.models.taskTiming
                .findAll({ where: {
                    taskId: req.params.taskId
                }})
                .then(timing => cb(null, timing), err => cb(err)),
            cb => 
                req.models.taskComment
                .findAll({
                    where: {
                        taskId: req.params.taskId
                    },
                    include: [{
                        model: req.models.user
                    }]
                })
                .then(timing => cb(null, timing), err => cb(err)),
            cb => req.models.request
                .findAll({
                    where: {
                        $and: [
                            {
                                taskId: req.params.taskId
                            }
                        ]
                    },
                    include: [
                        { model: req.models.user, as: "fromUser" }
                    ]
                })
                .then(requests => cb(null, requests), err => cb(err))
        ], (err, data) => {
            if (err) {
                return res.status(400).send(err);
            }

            const task = JSON.parse(JSON.stringify(data[0]));

            task.categories = JSON.parse(JSON.stringify(data[1]));
            task.images = JSON.parse(JSON.stringify(data[2]));
            task.location = JSON.parse(JSON.stringify(data[3]));
            task.timing = JSON.parse(JSON.stringify(data[4]));
            task.comments = JSON.parse(JSON.stringify(data[5]));
            task.requests = JSON.parse(JSON.stringify(data[6]));

            return res.send(task);
        })
    );
  
    /*
        updates task header info like title or description
    */
    app.put("/api/task/:taskId", isLoggedIn, (req, res) => {
        const taskId = req.params.taskId;
        const userId = String(req.user.id);
        const updatedTask = req.body;
        const newStatus = updatedTask.status;

        /*
            updatedTask.description = striptags(updatedTask.description, [
                'p',
                'br'
            ]);
        */

        const fieldsToBeExcluded = [ 
            "id",
            "userId",
            "categories",
            "duration"
        ];

        Object.keys(updatedTask)
        .forEach(itemKey => {
            if (fieldsToBeExcluded.indexOf(itemKey) !== -1) {
                delete updatedTask[itemKey];
            }
        });
        
        updatedTask.status = updatedTask.status ? String(updatedTask.status) : "0";     
        
        var task;

        async.waterfall([
            cb => {
                isMyTask(req.models, taskId, userId)
                .then(rTask => {
                    task = rTask;

                    cb();
                }, cb);
            },
            cb => {
                task
                .update(updatedTask)
                .then(() => cb(), cb);
            },
            cb => {
                if (newStatus === req.models.task.TASK_STATUS.ACTIVE) {
                    // emails are enabled now just for demand listings
                    if (task.taskType === 1) {
                        taskEmitter
                        .emit("new-task", req.models, task.id);
                    }
                }

                if (newStatus === req.models.task.TASK_STATUS.INACTIVE) {
                    taskEmitter
                        .emit("cancelled", req.models, task);

                    requestCtrl
                    .declineAllPendingRequestsForTask(req.models, taskId, err => {
                        if (err) {
                            console.error(err);
                        }
    
                        console.log(`[SUCCESS] All pending requests for task ${taskId} have been declined!`);
                    });
                }

                cb();
            }
        ], err => {
            sendResponse(res, err, task);
        });
    });
};