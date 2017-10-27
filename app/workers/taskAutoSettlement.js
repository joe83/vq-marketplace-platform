const async = require("async");
const db = require("../models/models.js");
const orderCtrl = require("../controllers/orderCtrl");
const utils = require("../utils");

const taskAutoSettlement = (tenantId) => {
    const models = db.get(tenantId);

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
            console.log(`[WORKER AUTOSETTLEMENT] Retrieved ${orders.length} orders.`);

            async
            .eachSeries(orders, (order, cb) => {
                if (!order.autoSettlementStartedAt) {
                    return cb();
                }
                
                const nowUnixTime = utils.getUtcUnixTimeNow();
                const timeDiff = nowUnixTime - order.autoSettlementStartedAt;
                const adjustedTimeDiffInHours = timeDiff / 60 / 60;
                
                console.log(`[WORKER AUTOSETTLEMENT] Now: ${nowUnixTime}, autoSettlementStartedAt: ${order.autoSettlementStartedAt}, timeDiffInHours: ${adjustedTimeDiffInHours}`);

                if (adjustedTimeDiffInHours >= 8) {
                    return orderCtrl
                        .settleOrder(order.id, order.userId, (err, order) => {
                            if (err) {
                                return cb(err);
                            }

                            settled++;

                            console.log(`[WORKER AUTOSETTLEMENT] Settled order ${order.userId}`);

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

module.exports = taskAutoSettlement;
