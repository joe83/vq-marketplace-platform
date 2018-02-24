const ejs = require("ejs");
const mandrill = require("mandrill-api/mandrill");
const custProvider = require("../config/custProvider.js");
const unescape = require("unescape");
const _ = require("underscore");

const mandrill_client = new mandrill.Mandrill(process.env.MANDRILL);

const EMAILS = {
	WELCOME: "welcome",
	PASSWORD_RESET: "password-reset",
	REQUEST_SENT: "new-request-sent",
	REQUEST_RECEIVED: "new-request-received",
	NEW_LISTING: "new-task"
};

const checkEmailScenarioForUser = (emailCode, userType, demandListingsEnabled, supplyListingsEnabled, cb) => {
			switch (userType) {
				case (0): {
					return
						[
							'new-order-for-supply',
							'listing-cancelled',
							'request-marked-as-done',
							'request-completed',
							'review-left',
							'order-closed-for-supply',
							'message-received',
							'task-marked-spam',
							'new-order',
							'order-marked-as-done',
							'order-completed',
							'order-closed'
						].indexOf(emailCode) !== -1;
				}
				case (1): {
					if (
						demandListingsEnabled === "1" &&
						supplyListingsEnabled !== "1"
					) {
						return [
							'new-request-received',
							'listing-cancelled',
							'task-request-cancelled',
							'new-order',
							'order-marked-as-done',
							'order-completed',
							'review-left',
							'order-closed',
							'message-received',
							'task-marked-spam'
						].indexOf(emailCode) !== -1;
					}
					if (
						demandListingsEnabled !== "1" &&
						supplyListingsEnabled === "1"
					) {
						return [
							'new-order',
							'order-marked-as-done',
							'order-completed',
							'review-left',
							'order-closed',
							'message-received'
						].indexOf(emailCode) !== -1;
					}
					if (
						demandListingsEnabled === "1" &&
						supplyListingsEnabled === "1"
					) {
						return [
							'review-left',
							'message-received',
							'listing-cancelled',
							'new-order',
							'order-marked-as-done',
							'order-completed',
							'order-closed',
							'request-marked-as-done'
						].indexOf(emailCode) !== -1;
					}
				}
				case (2): {
					if (
						demandListingsEnabled === "1" &&
						supplyListingsEnabled !== "1"
					) {
						return [
							'new-task',
							'new-request-sent',
							'request-declined',
							'request-cancelled',
							'request-accepted',
							'request-marked-as-done',
							'request-completed',
							'review-left',
							'request-closed',
							'message-received'
						].indexOf(emailCode) !== -1;
					}
					if (
						demandListingsEnabled !== "1" &&
						supplyListingsEnabled === "1"
					) {
						return [
							'new-order-for-supply',
							'listing-cancelled',
							'request-marked-as-done',
							'request-completed',
							'review-left',
							'order-closed-for-supply',
							'message-received',
							'task-marked-spam'
						].indexOf(emailCode) !== -1;
					}
					if (
						demandListingsEnabled === "1" &&
						supplyListingsEnabled === "1"
					) {
						return [
							'review-left',
							'message-received',
							'listing-cancelled',
							'new-order',
							'order-marked-as-done',
							'order-completed',
							'order-closed',
							'request-marked-as-done'
						].indexOf(emailCode) !== -1;
					}
				}
			}
}

const checkIfShouldSendEmail = (models, emailCode, userId, cb, shouldNotCb) => models
	.userProperty
	.findOne({
		where: {
			$and: [
				{
					propKey: "EMAIL_" + emailCode,
				}, {
					propValue: "1"
				}, {
					userId
				}
			]
		}
	})
	.then(isDeactived => {
		if (!isDeactived) {
			return cb();
		}

		if (shouldNotCb) {
			shouldNotCb();
		}
	}, err => {
		console.error(err);
	});

const getEmailBody = (models, code) => models.post
	.findOne({ 
		where: {
			$and: [
				{
					type: "email",
				}, {
					code
				}
			]
	}});

const getEventEmails = (models, eventTrigger) => models.post
	.findAll({ 
		where: {
			$and: [
				{
					type: "email",
				}, {
					eventTrigger
				}
			]
	}});

const sendEmailsOnEvent = (models, eventTrigger, demandUserEmails, supplyUserEmails, emailData) =>
	custProvider
	.getConfig(models)
	.then(config => {
		if (typeof emailData === "string") {
			emailData = {
				ACTION_URL: emailData,
				LISTING_TITLE: "<LISTING_TITLE NOT SPECIFIED>",
				SENDER_FIRST_NAME: "<SENDER_FIRST_NAME NOT SPECIFIED>",
				SENDER_LAST_NAME: "<SENDER_LAST_NAME NOT SPECIFIED>",
				MESSAGE_BODY: "<MESSAGE_BODY NOT SPECIFIED>",
				EMAIL_SETTINGS_URL: `${config.DOMAIN}/app/account/notifications`
			};
		} else {
			emailData.ACTION_URL = emailData.ACTION_URL || "<ACTION_URL NOT SPECIFIED>";
			emailData.SUPPLY_ACTION_URL = emailData.SUPPLY_ACTION_URL || "<SUPPLY_ACTION_URL NOT SPECIFIED>";
			emailData.LISTING_TITLE = emailData.LISTING_TITLE || "<LISTING_TITLE NOT SPECIFIED>";
			emailData.SENDER_FIRST_NAME = emailData.SENDER_FIRST_NAME || "<SENDER_FIRST_NAME NOT SPECIFIED>";
			emailData.SENDER_LAST_NAME = emailData.SENDER_LAST_NAME || "<SENDER_LAST_NAME NOT SPECIFIED>";
			emailData.MESSAGE_BODY = emailData.MESSAGE_BODY || "<MESSAGE_BODY NOT SPECIFIED>";
			emailData.EMAIL_SETTINGS_URL = emailData.EMAIL_SETTINGS_URL = `${config.DOMAIN}/app/account/notifications`;
		}

		emailData.CONFIG = config;

		getEventEmails(models, eventTrigger)
		.then(emails => {
			emails
			.filter(email => email.targetUserType && email.eventTrigger)
			.forEach(email => {
				const params = {};
				let compiledEmail;



				const specialEmailData = email.targetUserType === 2 ?
					_.extend({}, emailData, {
						ACTION_URL: emailData.SUPPLY_ACTION_URL
					}) : emailData;

				try {
					compiledEmail = ejs.compile(unescape(email.body))(specialEmailData);
				} catch (err) {
					return console.error(err);
				}
	
				params.subject = email.title;
				
				console.log(`Sending email ${email.code} (event: ${eventTrigger}) to ${email.targetUserType === 1 ? demandUserEmails.length : supplyUserEmails.length} users.`);
				
				return sendEmail(models, compiledEmail, email.targetUserType === 1 ? demandUserEmails : supplyUserEmails, params, err => {
					if (err) {
						console.error(err);
					}
				});
			});
		});
	});

const getEmailAndSend = (models, emailCode, email, emailData) =>
	custProvider
	.getConfig(models)
	.then(config => {
		// in case emails are disabled... only the welcome email can be sent.
		if (emailCode !== EMAILS.WELCOME && config.EMAILS_ENABLED !== "1") {
			return;
		}

		getEmailBody(models, emailCode)
		.then(emailBody => {
			const params = {};
			var compiledEmail;
			
			if (!emailBody) {
				return console.error(`Email template "${emailCode}" has not been found`);
			}

			if (typeof emailData === "string") {
				emailData = {
					ACTION_URL: emailData,
					LISTING_TITLE: "<LISTING_TITLE NOT SPECIFIED>",
					SENDER_FIRST_NAME: "<SENDER_FIRST_NAME NOT SPECIFIED>",
					SENDER_LAST_NAME: "<SENDER_LAST_NAME NOT SPECIFIED>",
					MESSAGE_BODY: "<MESSAGE_BODY NOT SPECIFIED>",
					EMAIL_SETTINGS_URL: `${config.DOMAIN}/app/account/notifications`
				};
			} else {
				emailData.ACTION_URL = emailData.ACTION_URL || "<ACTION_URL NOT SPECIFIED>";
				emailData.LISTING_TITLE = emailData.LISTING_TITLE || "<LISTING_TITLE NOT SPECIFIED>";
				emailData.SENDER_FIRST_NAME = emailData.SENDER_FIRST_NAME || "<SENDER_FIRST_NAME NOT SPECIFIED>";
				emailData.SENDER_LAST_NAME = emailData.SENDER_LAST_NAME || "<SENDER_LAST_NAME NOT SPECIFIED>";
				emailData.MESSAGE_BODY = emailData.MESSAGE_BODY || "<MESSAGE_BODY NOT SPECIFIED>";
				emailData.EMAIL_SETTINGS_URL = emailData.EMAIL_SETTINGS_URL = `${config.DOMAIN}/app/account/notifications`;
			}

			emailData.CONFIG = config;

			try {
				compiledEmail = ejs.compile(unescape(emailBody.body))(emailData);
			} catch (err) {
				return console.error(err);
			}

			params.subject = emailBody.title;

			return sendEmail(models, compiledEmail, typeof email === "string" ? [
				email
			] : email, params, err => {
				if (err) {
					console.error(err);
				}
			});
		});
	});

const sendNewTenant = (email, VERIFICATION_LINK) => {
	const emailBody = `
		<%- VERIFICATION_LINK %>
	`;

	const params = {};

	const html = ejs.compile(unescape(emailBody))({
		VERIFICATION_LINK
	});

	params.subject = "Verify your email";

	const message = getRawMessagePrototype();

	message.subject = params.subject;
	message.html = html;
	message.text = html;
	message.to = [{
		email,
		type: "to"
	}];

	var lAsync = false;
	var ip_pool = "Main Pool";

	mandrill_client
	.messages
	.send({ 
		"message": message,
		"async": lAsync,
		"ip_pool": ip_pool
	}, result => {
		console.log(result);
	}, e => {
		console.log("A mandrill error occurred: " + e.name + " - " + e.message);
	});	
};

const sendTemplateEmail = (email, subject, body) => {
	const message = getRawMessagePrototype();

	message.subject = subject;
	message.html = body;
	message.text = body;
	message.to = [{
		email,
		type: "to"
	}];

	var lAsync = false;
	var ip_pool = "Main Pool";

	mandrill_client
	.messages
	.send({
		"message": message,
		"async": lAsync,
		"ip_pool": ip_pool
	}, result => {
		console.log(result);
	}, e => {
		console.log("A mandrill error occurred: " + e.name + " - " + e.message);
	});
};

const getRawMessagePrototype = (fromName, supportEmail, domain) => ({
	"from_email": "noreply@vq-labs.com",
	"from_name": fromName,
	"to": [ ],
	"headers": {
		"Reply-To": supportEmail
	},
	"important": false,
	"global_merge_vars": [],
	"metadata": {
		"website": domain
	},
	"recipient_metadata": [{}],
});


const getMessagePrototype = models => new Promise((resolve, reject) => {
	custProvider
	.getConfig(models)
	.then(config => {
		return resolve(getRawMessagePrototype(config.NAME || "VQ LABS", config.SUPPORT_EMAIL, config.DOMAIN));
	}, reject);
});

function sendEmail (models, html, tEmails, params, callback) {
	getMessagePrototype(models)
	.then(message => {
		message.subject = params.subject;
		message.html = html;
		message.text = html;
		message.to = tEmails.map(email => {
			return {
				email,
				type: "to"
			};
		});
	
		var lAsync = false;
		var ip_pool = "Main Pool";
	
		mandrill_client
		.messages
		.send({ 
			"message": message,
			"async": lAsync,
			"ip_pool": ip_pool
		}, result => {
			console.log(result);
	
			if (callback) {
				callback(null, result);
			}
		}, e => {
			console.log("A mandrill error occurred: " + e.name + " - " + e.message);
	
			return callback(e);
		});	
	});
}

module.exports = {
	EMAILS,
	checkIfShouldSendEmail,
	sendEmailsOnEvent,
	getEmailAndSend,
	sendEmail,
	sendTemplateEmail,
	sendNewTenant,
	getEventEmails,
	checkEmailScenarioForUser
};
