const async = require("async");
const models = require("../models/models.js");
const orderCtrl = require("../controllers/orderCtrl");

const userCalculateRatings = require("./userCalculateRatings");
const taskAutoSettlement = require("./taskAutoSettlement");

const ONE_HOUR_INTERVAL = 1000 * 60 * 60;
const TEN_MINUTES_INTERVAL = 1000 * 60 * 60;

const registerWorkers = () => {
    console.log('[WORKERS] Initiating...');
  
    setInterval(() => {   
        taskAutoSettlement();
    }, 30 * 1000);

    
    setInterval(() => {   
        userCalculateRatings();
    }, 30 * 1000);
    

    console.log('[WORKERS] Started.');
};

if (module.parent) {
    module.exports = {
        registerWorkers
    };
} else {
    taskAutoSettlement();
    userCalculateRatings();
}