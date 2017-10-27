const async = require("async");
const models = require("../models/models.js");
const orderCtrl = require("../controllers/orderCtrl");

const userCalculateRatings = require("./userCalculateRatings");
const taskAutoSettlement = require("./taskAutoSettlement");
const taskAutoCancel = require("./taskAutoCancel");
const runReporting = require("./reporting");

const WORKER_INTERVAL = 1000 * 60 * 5;

const registerWorkers = tenantId => {
    console.log(`[WORKERS] Starting for tenant ${tenantId}`);
  
    setInterval(() => {   
        taskAutoSettlement(tenantId);
    }, WORKER_INTERVAL);
    
    setInterval(() => {   
        userCalculateRatings(tenantId);
    }, WORKER_INTERVAL);
    

    setInterval(() => {   
        taskAutoCancel(tenantId);
    }, WORKER_INTERVAL);

    setInterval(() => {
        runReporting(tenantId);
    }, WORKER_INTERVAL);
    
    console.log(`[WORKERS] Started for tenant ${tenantId}`);
};


module.exports = {
    registerWorkers
};
