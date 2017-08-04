"use strict"
const EventEmitter = require('events');
const async = require('async');
const randtoken = require('rand-token');
const emailService = require("../services/emailService");
class DefaultEmitter extends EventEmitter {}
const userEmitter = new DefaultEmitter();

module.exports = userEmitter;

userEmitter.on('created', user => {
    // emailService.sendWelcome(user);
});
