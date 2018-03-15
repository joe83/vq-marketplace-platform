const async = require("async");
const db = require("../models/models.js");
const taskEmitter = require("../events/task");

//polyfill for using .ts for development and js after build
let requestCtrl;
try {
    requestCtrl = require("../controllers/requestCtrl.ts");
} catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
        throw e;
    }
    requestCtrl = require("../controllers/requestCtrl.js");
}

const taskAutoCancel = (tenantId) => {
    const models = db.get(tenantId);

    var cancelled = 0;

    console.log("[WORKER] Task hourly cancel started.");

    const now = new Date();
    const nowUtc = new Date(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
    );

    async.waterfall([
        cb => {
            models.task
            .findAll({
                include: [
                    {
                        model: models.taskTiming,
                        where: {
                            endDate: {
                                $lte: nowUtc.getTime() / 1000
                            }
                        }
                    }
                ],
                where: {
                    status: models.task.TASK_STATUS.ACTIVE
                }
            })
            .then(tasks => {
                cb(null, tasks);
            }, cb);
        },
        (tasks, cb) => {
            async
            .eachSeries(tasks, (task, cb2) => {
                cancelled++;

                taskEmitter.emit("cancelled", models, task);

                task
                .update({
                    status: models.task.TASK_STATUS.INACTIVE
                })
                .then(() => {
                    requestCtrl
                    .declineAllPendingRequestsForTask(models, task.id, err => {
                        if (err) {
                            console.error(err);

                            return cb2(err);
                        }

                        console.log(`[SUCCESS] All pending requests for task ${task.id} have been declined!`);

                        return cb2();
                    });
                });
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
