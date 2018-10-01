const async = require("async");
const db = require("../models/models");
const orderCtrl = require("../controllers/orderCtrl");
const utils = require("../utils");

const taskAutoSettlement = (tenantId) => {
  const models = db.get(tenantId);

  var settled = 0;

  console.log("[WORKER] Task hourly auto-settlement started.");

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
        .eachSeries(orders, (order, cb2) => {
          if (!order.autoSettlementStartedAt) {
            return cb2();
          }

          const nowUnixTime = utils.getUtcUnixTimeNow();
          const timeDiff = nowUnixTime - order.autoSettlementStartedAt;
          const adjustedTimeDiffInHours = timeDiff / 60 / 60;

          console.log("[WORKER AUTOSETTLEMENT]");

          if (adjustedTimeDiffInHours >= 8) {
            return orderCtrl
              .settleOrder(models, order.id, order.userId, (err, rSettledOrder) => {
                if (err) {
                  return cb2(err);
                }

                settled++;

                console.log(`[WORKER AUTOSETTLEMENT] Settled order ${rSettledOrder.userId}`);

                return cb2();
              });
          }

          return cb2();
        }, cb);
    }
  ], err => {
    console.log(`[WORKER] ${settled} orders have been settled`);

    if (err) {
      return console.error(err);
    }
  });
};

module.exports = taskAutoSettlement;
