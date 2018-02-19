const async = require("async");
const requestEmitter = require("../events/request");
const orderEmitter = require("../events/order");
const taskEmitter = require("../events/task");
const utils = require("../utils");
const requestCtrl = require("../controllers/requestCtrl");

const cancelAllUnbookedTasks = (models: any, categoryCode: string, cb: any) => {

    const taskIds: any = [];
    let unBookedTasks: any[];

    return async.waterfall([
        (cb: any) => {         
            models.taskCategory
            .findAll({
                where: {
                    code: categoryCode
                }
            })
            .then((taskCategories: any[]) => {
                taskCategories.forEach((taskCategory: any) => {
                    taskIds.push(taskCategory.dataValues.taskId);
                });
                
                cb();
            }, cb)
        },
        (cb: any) => {
            models.task
            .findAll({
                where: {
                    $and: [
                        {
                            id: {
                                $in: taskIds
                            }
                        },
                        {
                            status: models.task.TASK_STATUS.ACTIVE
                        }
                    ]
                }
            })
            .then((tasksToCancel: any[]) => {
                unBookedTasks = tasksToCancel;

                cb();
            }, cb);
        },
        (cb: any) => {
            async.eachSeries(unBookedTasks, (task: any, cb: any) => {
                return models
                    .task
                    .update({
                        status: models.task.TASK_STATUS.INACTIVE
                    }, {
                        where: {
                            id: task.id
                        }
                    })
                    .then(() => cb(), cb);
            }, cb);
        },
        (cb: any) => {
            async.eachSeries(unBookedTasks, (task: any, cb: any) => {
                return requestCtrl.cancelAllPendingRequestsForTask(models, task.id, cb)
            }, cb);
        }

    ], cb);




};

module.exports = {
    cancelAllUnbookedTasks,
};
