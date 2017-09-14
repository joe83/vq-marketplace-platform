const async = require("async");
const models = require("../models/models.js");
const orderCtrl = require("../controllers/orderCtrl");

const userCalculateRatings = require("./userCalculateRatings");
const taskAutoSettlement = require("./taskAutoSettlement");
const taskAutoCancel = require("./taskAutoCancel");

const WORKER_INTERVAL = 1000 * 60 * 5;


const registerWorkers = () => {
    console.log('[WORKERS] Initiating...');
  
    setInterval(() => {   
        taskAutoSettlement();
    }, WORKER_INTERVAL);

    
    setInterval(() => {   
        userCalculateRatings();
    }, WORKER_INTERVAL);
    

    setInterval(() => {   
        taskAutoCancel();
    }, WORKER_INTERVAL);
    
    console.log('[WORKERS] Started.');
};

if (module.parent) {
    module.exports = {
        registerWorkers
    };
} else {
    taskAutoSettlement();
    userCalculateRatings();
    taskAutoCancel();
}