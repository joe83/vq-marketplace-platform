// const taskAutoSettlement = require("./taskAutoSettlement");
// const taskAutoCancel = require("./taskAutoCancel");
const runReporting = require("./reporting");

const WORKER_INTERVAL = 1000 * 60 * 5;

const registerWorkers = (tenantId: string) => {
    /*
    setInterval(() => {
        taskAutoSettlement(tenantId);
    }, WORKER_INTERVAL);
    setInterval(() => {
        taskAutoCancel(tenantId);
    }, WORKER_INTERVAL);
    */

    setInterval(() => {
        runReporting(tenantId);
    }, WORKER_INTERVAL);
};

module.exports = {
    registerWorkers
};
