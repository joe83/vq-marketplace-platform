const async = require("async");
const requestCtrl = require("../controllers/requestCtrl.js");
const models = require("../models/models.js");
const utils = require('../utils');
const taskEmitter = require("../events/task");

const taskAutoCancel = () => {
    var cancelled = 0;

    console.log('[WORKER] Task hourly cancel started.');

    async.waterfall([
        cb => {
            models.task
            .findAll({
                where: {
                    status: models.task.TASK_STATUS.ACTIVE
                },
                include: [
                    {
                        model: models.taskTiming,
                        where: {
                            endDate: {
                                $lte: utils.transformJSDateToSqlFormat(new Date())
                            }
                        }
                    }
                ]
            })
            .then(tasks => {
                cb(null, tasks);
            }, cb);
        },
        (tasks, cb) => {
            async
            .eachSeries(tasks, (task, cb) => {
                cancelled++;

                taskEmitter.emit('cancelled', task);

                task
                .update({
                    status: models.task.TASK_STATUS.INACTIVE
                })
                .then(_ => {
                    requestCtrl
                    .declineAllPendingRequestsForTask(task.id, err => {
                        if (err) {
                            console.error(err);

                            cb(err);
                        }
    
                        console.log(`[SUCCESS] All pending requests for task ${task.id} have been declined!`);

                        return cb();
                    });
                })
            }, cb);
        }
    ], err => {
        console.log(`[WORKER] ${cancelled} tasks have been cancelled`);

        if (err) {
            return console.error(err);
        }

        if (!module.parent) {
            return process.exit();
        }
    });
};

if (module.parent) {
    module.exports = taskAutoCancel;
} else {
    taskAutoCancel();
}  