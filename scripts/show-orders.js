const async = require("async");
const models = require("../app/models/models.js");

const showOrders = () => {
    var settled = 0;

    console.log('[WORKER] Task hourly auto-settlement started.');

    async.waterfall([
        cb => {
            models.order
            .findAll({
                where: {
                    status: models.order.ORDER_STATUS.SETTLED
                }
            })
            .then(orders => {
                cb(null, orders);
            }, cb);
        },
        (orders, cb) => {
            console.log(`Retrieved ${orders.length} orders.`);
            
        }
    ], err => {
        if (err) {
            return console.error(err);
        }

        if (!module.parent) {
            return process.exit();
        }
    });
};

if (module.parent) {
    module.exports = showOrders;
} else {
    showOrders();
}