var moment = require("moment");
var momentTimezone = require("moment-timezone");
var cust = require("../config/customizing.js");


module.exports = {
    formatDate : formatDate,
    formatTime : formatTime
};

function formatDate(date){
 return  momentTimezone(date).tz(cust.timezone).format(cust.dateOnlyFormat);
}

function formatTime(time){
 return  momentTimezone(time).tz(cust.timezone).format(cust.timeFormat);
}