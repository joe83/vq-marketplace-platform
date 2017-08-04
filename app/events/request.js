"use strict";

const EventEmitter = require('events');
const async = require('async');
const randtoken = require('rand-token');
const models = require("../models/models");

class DefaultEmitter extends EventEmitter {}

const requestEmitter = new DefaultEmitter();

module.exports = requestEmitter;

requestEmitter.on('new-request-message', (fromUserId, toUserId, taskId, message) => {
	// EmailService.sendNewChatMessageReceived(results);
});

requestEmitter.on('new-request', (taskId, fromUserId, requestMessage) => {
	// EmailService.sendNewChatMessageReceived(results);
});