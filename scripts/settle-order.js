const async = require("async");
const models = require("../src/app/models/models.js");
const orderCtrl = require("../src/app/controllers/orderCtrl");

const TIME_INTERVAL = 1000 * 60 * 60;

orderCtrl
    .settleOrder(process.argv[2], process.argv[3], (err, order) => {
        if (err) {
            console.error(err);

            return process.exit();
        }

        console.log(`Settled order ${order.id}`);

        return process.exit();
    });
    