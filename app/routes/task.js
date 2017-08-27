const async = require('async');
const sendResponse = require("../controllers/responseController.js").sendResponse;
const identifyUser = require("../controllers/responseController.js").identifyUser;
const isLoggedIn = require("../controllers/responseController.js").isLoggedIn;
const isLoggedInAndVerified = require("../controllers/responseController.js").isLoggedInAndVerified;
const cust = require("../config/customizing.js");
const models  = require('../models/models');
const striptags = require('striptags');

const isMyTask = (taskId, myUserId) => {
    return models.task.findOne({
        where: [
            { id: taskId }
        ]
    })
    .then(task => new Promise((resolve, reject) => {
        if (!task) {
            return reject({
                status: 400, 
                code: 'TASK_DOES_NOT_EXIT' 
            });
        }

        if (Number(task.userId) !== Number(myUserId)) {
            return reject({ 
                status: 401, 
                code: 'NOT_YOUR_TASK' 
            });
        }

        return resolve();
    }))
};

const getTaskAdditionalInfo = taskId => new Promise((resolve, reject) => async.parallel([
    cb => 
        models.taskCategory
        .findAll({ where: { taskId: taskId } })
        .then(categories => cb(null, categories), err => cb(err)),
    cb => 
        models.taskImage
        .findAll({ where: { taskId: taskId } })
        .then(images => cb(null, images), err => cb(err)),
    cb => 
        models.taskLocation
        .findOne({ where: { taskId: taskId } })
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
	app.get('/api/task', 
        identifyUser, 
        (req, res) => {
            const query = {};

            query.include = [];

            query.include.push({
                model: models.request,
                include: [
                    { model: models.user, as: 'fromUser' },
                ]
            });

            query.include.push({
                model: models.taskTiming
            });

            
            if (req.query && req.query.category) {
                query.include.push(
                    { 
                        model: models.taskCategory,
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

                if (req.query.status) {
                    query.where.$and.push({
                        status: String(req.query.status)
                    });
                }
                
                if (req.query.userId) {
                    query.where.$and.push({
                        userId: req.query.userId
                    });
                }

                if (req.query.taskType) {
                    query.where.$and.push({
                        taskType: req.query.taskType
                    });
                }
            }

            return models.task
                .findAll(query)
                .then(rTasks => new Promise(
                    (resolve, reject) => {
                        tasks = JSON.parse(JSON.stringify(rTasks));

                        async.eachLimit(tasks, 5, (task, cb) => {
                                getTaskAdditionalInfo(task.id)
                                .then(taskAdditionalInfo => {
                                    task.categories = taskAdditionalInfo.categories;
                                    task.images = taskAdditionalInfo.images;
                                    task.location = taskAdditionalInfo.location;

                                    return cb();
                                }, err => cb(err));
                        }, err => {
                            if (err) {
                                return reject(err);
                            }

                            return resolve(tasks);
                        });
                    })
                )
                .then(tasks =>  sendResponse(res, null, tasks), err => sendResponse(res, err))
            });

    app.post('/api/task',
        isLoggedInAndVerified,
        (req, res) => {
            models.task
                .create({
                    status: models.task.TASK_STATUS.CREATION_IN_PROGRESS,
                    taskType: 1,
                    userId: req.user.id
                })
                .then(task => sendResponse(res, null, task))
                .catch(err => sendResponse(res, err));
        });

    app.post('/api/task/:taskId/comment',
        isLoggedIn,
        (req, res) => {
            models.taskComment
            .create({
                comment: req.body.comment,
                userId: req.user.id,
                taskId: req.params.taskId
            })
            .then(data => sendResponse(res, null, data))
            .catch(err => sendResponse(res, err));
        });

   app.post('/api/task/:taskId/category',
        isLoggedIn,
        (req, res) => {
            isMyTask(req.params.taskId, req.user.id)
            .then(() => models.taskCategory.destroy({
                where: {
                    taskId: req.params.taskId
                }
            }))
            .then(() => new Promise((resolve, reject) => 
                async.each(req.body, (code, cb) => {
                    return models.taskCategory
                        .create({ code, taskId: req.params.taskId })
                        .then(ok => cb(), err => cb(err))
                }, err => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve();
            })))
            .then(task => sendResponse(res, null, { ok: true }), err => sendResponse(res, err))
        });

   app.post('/api/task/:taskId/image',
        isLoggedIn,
        (req, res) => {
            isMyTask(req.params.taskId, req.user.id)
            .then(() => models.taskImage.destroy({
                where: {
                    taskId: req.params.taskId
                }
            }))
            .then(() => new Promise((resolve, reject) =>
                async.each(req.body, (image, cb) => {
                    return models.taskImage
                        .create({ imageUrl: image.imageUrl, taskId: req.params.taskId })
                        .then(ok => cb(), err => cb(err))
                }, err => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve();
            })))
            .then(task => sendResponse(res, null, { ok: true }), err => sendResponse(res, err))
        });

    app.post('/api/task/:taskId/timing',
        isLoggedIn,
        (req, res) => {
            isMyTask(req.params.taskId, req.user.id)
            .then(() => models.taskTiming.destroy({
                where: {
                    taskId: req.params.taskId
                }
            }))
            .then(() => new Promise((resolve, reject) =>
                async.each(req.body.dates, (timing, cb) => {
                    try {
                        timing = new Date(timing).toISOString().slice(0, 19).replace('T', ' ');
                    } catch(err) {
                        return cb (err);
                    }

                    return models.taskTiming
                        .create({
                            duration: req.body.duration,
                            date: timing,
                            type: '',
                            taskId: req.params.taskId
                        })
                        .then(ok => cb(), err => cb(err))
                }, err => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve();
            })))
            .then(task => sendResponse(res, null, { ok: true }), err => sendResponse(res, err))
        });

   /*
    Updates location for a task
   */
   app.post('/api/task/:taskId/location',
        isLoggedIn,
        (req, res) => {
            req.body.taskId = req.params.taskId;

            isMyTask(req.params.taskId, req.user.id)
            .then(() => models.taskLocation.destroy({
                where: {
                    taskId: req.params.taskId
                }
            }))
            .then(() => new Promise((resolve, reject) => {
                return models
                .taskLocation
                .create(req.body)
                .then(_ => {
                    resolve(_);
                }, _ => {
                    reject(_);
                });
            }))
            .then(taskLocation => {
                return sendResponse(res, null, taskLocation);
            })
            .catch(err => {
                return sendResponse(res, err);
            });
        });

   app.get('/api/task/:taskId', 
    identifyUser, 
    (req, res) => 
        async.parallel([
            cb => 
                models.task
                .findAll({
                    where: {
                        id: req.params.taskId
                    },
                    include: [{
                        model: models.user
                    }]
                })
                .then(task => task[0] ? cb(null, task[0]) : cb('Not found')),
            cb => 
                models.taskCategory
                .findAll({ where: {
                    taskId: req.params.taskId
                }})
                .then(categories => cb(null, categories), err => cb(err)),
            cb => 
                models.taskImage
                .findAll({ where: { taskId: req.params.taskId } })
                .then(images => cb(null, images), err => cb(err)),
            cb => 
                models.taskLocation
                .findOne({ where: { taskId: req.params.taskId } })
                .then(location => cb(null, location), err => cb(err)),
            cb => 
                models.taskTiming
                .findAll({ where: {
                    taskId: req.params.taskId
                }})
                .then(timing => cb(null, timing), err => cb(err)),
            cb => 
                models.taskComment
                .findAll({
                    where: {
                        taskId: req.params.taskId
                    },
                    include: [{
                        model: models.user
                    }]
                })
                .then(timing => cb(null, timing), err => cb(err)),
            cb => models.request
                .findAll({
                    where: {
                        $and: [
                            {
                                taskId: req.params.taskId
                            }
                        ]
                    }
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
    app.put('/api/task/:taskId', isLoggedIn, (req, res) => {
        const taskId = req.params.taskId;
        const userId = String(req.user.id);
        const updatedTask = req.body;

        /*
            updatedTask.description = striptags(updatedTask.description, [
                'p',
                'br'
            ]);
        */

        const fieldsToBeExcluded = [  'id', 'userId', 'categories', 'duration' ];

        Object.keys(updatedTask)
        .forEach(itemKey => {
            if (fieldsToBeExcluded.indexOf(itemKey) !== -1) {
                delete updatedTask[itemKey];
            }
        });

        const updatedFields = req.body;

        if (updatedTask.status) {
            updatedTask.status = String(updatedTask.status);
        }
        
        isMyTask(taskId, userId)
        .then(() => models.task.update(updatedTask, {
            where: {
                id: taskId 
            } 
        }))
        .then(task => sendResponse(res, null, { ok: true }), err => sendResponse(res, err));
    });
};