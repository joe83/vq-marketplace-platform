"use strict";

const EventEmitter = require('events');
const async = require('async');
const randtoken = require('rand-token');
const models = require("../models/models");
const EmailService = require("../services/emailService.js");
const config = require("../config/configProvider.js")();
const vqAuth = require("../config/vqAuthProvider");

class DefaultEmitter extends EventEmitter {}

const requestEmitter = new DefaultEmitter();

requestEmitter.on('new-request-message', (fromUserId, toUserId, taskId, message) => {
	// EmailService.sendNewChatMessageReceived(results);
});

requestEmitter
	.on('new-request', requestId => {
		var fromUser, toUser, request;
		var requestSentEmails;
		var requestReceivedEmails;
		var ACTION_URL;

		async.waterfall([
			cb => models
				.request
				.findOne({
					where: {
						id: requestId
					},
					include: [
						{ model: models.user, as: 'fromUser' },
						{ model: models.user, as: 'toUser' }
					]
				})
				.then(rRequest => {
					request = rRequest;

					return cb();
				}, cb),
			cb => vqAuth
				.getEmailsFromUserId(request.fromUser.vqUserId, (err, rUserEmails) => {
					if (err) {
						return cb(err);
					}

					requestSentEmails = rUserEmails
						.map(_ => _.email);

					cb();
				}),
			cb => vqAuth
				.getEmailsFromUserId(request.toUser.vqUserId, (err, rUserEmails) => {
					if (err) {
						return cb(err);
					}

					requestReceivedEmails = rUserEmails
						.map(_ => _.email);
					
					cb();
				}),
			cb => models
				.appConfig
				.findOne({
					where: {
						fieldKey: 'DOMAIN'
					}
				})
				.then(configField => {
					configField = configField || {};
					
					const domain = configField.fieldValue || 'http://localhost:3000';

					ACTION_URL = 
						`${domain}/app/chat/${requestId}`;

					cb();
				}, cb)
		], err => {
			if (err) {
				return console.error(err);
			}

			if (requestReceivedEmails) {
				EmailService
					.getEmailAndSend('new-request-received', requestReceivedEmails[0], ACTION_URL);
			}
			
			if (requestSentEmails) {
				EmailService
					.getEmailAndSend('new-request-sent', requestSentEmails[0], ACTION_URL);
			}
		})
	});


if (module.parent) {
	module.exports = requestEmitter;
} else {
	console.log(process.argv[2])
	console.log(process.argv[3])
	
	requestEmitter.emit(process.argv[2], process.argv[3]);
}