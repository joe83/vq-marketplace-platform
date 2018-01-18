const ejs = require("ejs");
const mandrill = require("mandrill-api/mandrill");
const config = require("../config/configProvider.js")();
const custProvider = require("../config/custProvider.js");
const unescape = require("unescape");

const mandrill_client = new mandrill.Mandrill(config[config.env]["VQ_MARKETPLACE_API"]["MANDRILL"]);

const EMAILS = {
	WELCOME: "welcome",
	PASSWORD_RESET: "password-reset",
	REQUEST_SENT: "new-request-sent",
	REQUEST_RECEIVED: "new-request-received",
	NEW_LISTING: "new-task"
};

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

const getEmailAndSend = (models, emailCode, email, emailData) =>
	custProvider
	.getConfig(models)
	.then(config => {
		// in case emails are disabled... only the welcome email can be sent.
		if (emailCode !== EMAILS.WELCOME && config[config.env]["VQ_MARKETPLACE_API"]["EMAILS_ENABLED"] !== "1") {
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
					EMAIL_SETTINGS_URL: `${config[config.env]["VQ_MARKETPLACE_API"]["APP_URL"]}/app/account/notifications`
				};
			} else {
				emailData.ACTION_URL = emailData.ACTION_URL || "<ACTION_URL NOT SPECIFIED>";
				emailData.LISTING_TITLE = emailData.LISTING_TITLE || "<LISTING_TITLE NOT SPECIFIED>";
				emailData.SENDER_FIRST_NAME = emailData.SENDER_FIRST_NAME || "<SENDER_FIRST_NAME NOT SPECIFIED>";
				emailData.SENDER_LAST_NAME = emailData.SENDER_LAST_NAME || "<SENDER_LAST_NAME NOT SPECIFIED>";
				emailData.MESSAGE_BODY = emailData.MESSAGE_BODY || "<MESSAGE_BODY NOT SPECIFIED>";
				emailData.EMAIL_SETTINGS_URL = emailData.EMAIL_SETTINGS_URL = `${config[config.env]["VQ_MARKETPLACE_API"]["APP_URL"]}/app/account/notifications`;
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
		return resolve(getRawMessagePrototype(config[config.env]["VQ_MARKETPLACE_API"]["APP_NAME"] || "VQ LABS", config[config.env]["VQ_MARKETPLACE_API"]["APP_SUPPORT_EMAIL"], config[config.env]["VQ_MARKETPLACE_API"]["APP_URL"]));
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
	getEmailAndSend,
	sendEmail,
	sendTemplateEmail,
	sendNewTenant
};
