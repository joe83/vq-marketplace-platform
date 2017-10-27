const async = require("async");
const requestCtrl = require("../controllers/requestCtrl.js");
const db = require("../models/models.js");
const utils = require('../utils');
const taskEmitter = require("../events/task");

const taskAutoCancel = (tenantId) => {
    const models = db.get(tenantId);

    var cancelled = 0;

    console.log('[WORKER] Task hourly cancel started.');

    const now = new Date(); 
    const nowUtc = new Date(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()
    );

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
                                $lte: nowUtc.getTime() / 1000
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

                taskEmitter.emit('cancelled', models, task);

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