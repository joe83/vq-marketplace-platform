const async = require("async");
const models = require("../models/models.js");
const orderCtrl = require("../controllers/orderCtrl");

const TIME_INTERVAL = 1000 * 60 * 60;

const taskAutoSettlement = () => {
    var settled = 0;

    console.log('[WORKER] Task hourly auto-settlement started.');

    async.waterfall([
        cb => {
            models.order
            .findAll({
                where: {
                    status: models.order.ORDER_STATUS.MARKED_DONE
                }
            })
            .then(orders => {
                cb(null, orders);
            }, cb);
        },
        (orders, cb) => {
            async
            .eachSeries(orders, (order, cb) => {
                if (!order.autoSettlementStartedAt) {
                    return cb();
                }

                const timeDiff = Number(new Date) - Number(order.autoSettlementStartedAt);
                const adjustedTimeDiffInHours = timeDiff / 1000 / 60 / 60;

                if (adjustedTimeDiffInHours >= 8) {
                    // init settlement

                    return orderCtrl
                        .settleOrder(order.id, order.userId, (err, order) => {
                            if (err) {
                                return cb(err);
                            }

                            settled++;

                            console.log(`Settled order ${order.userId}`);

                            return cb();
                        });
                }

                return cb();
            }, cb);
        }
    ], err => {
        console.log(`[WORKER] ${settled} orders have been settled`);

        if (err) {
            return console.error(err);
        }

        if (!module.parent) {
            return process.exit();
        }
    });
};

const registerWorkers = () => {
    console.log('[WORKERS] Initiating...');
    
    // will run every hours
    setInterval(() => {
        taskAutoSettlement();
    }, TIME_INTERVAL);

    console.log('[WORKERS] Started.');
};

if (module.parent) {
    module.exports = {
        registerWorkers
    };
}  else {
    taskAutoSettlement();
}