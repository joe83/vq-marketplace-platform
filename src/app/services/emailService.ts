const ejs = require("ejs");
const mandrill = require("mandrill-api/mandrill");
const custProvider = require("../config/custProvider.js");
const unescape = require("unescape");
const _ = require("underscore");

import { IVQModels } from "../interfaces";

const mandrill_client = new mandrill.Mandrill(process.env.MANDRILL);

type TEmailCode = "welcome" | "password-reset";

export const EMAILS: { [emailCode: string]: TEmailCode } = {
	PASSWORD_RESET: "password-reset",
	WELCOME: "welcome"
};

export const getRawMessagePrototype = (fromName: string, supportEmail: string, domain: string) => ({
	from_email: "noreply@vq-labs.com",
	from_name: fromName,
	to: [ ],
	headers: {
		"Reply-To": supportEmail
	},
	important: false,
	global_merge_vars: [],
	metadata: {
		website: domain
	},
	recipient_metadata: [{}],
});

export const getMessagePrototype = models => new Promise((resolve, reject) => {
	custProvider
	.getConfig(models)
	.then(config => {
		return resolve(getRawMessagePrototype(config.NAME || "VQ LABS", config.SUPPORT_EMAIL, config.DOMAIN));
	}, reject);
});

export const sendEmail = (models, html, tEmails, params, callback) => {
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
};

export const checkIfShouldSendEmail = (models, emailCode, userId, cb, shouldNotCb) => models
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

export const getEmailBody = (models, code) => models.post
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

export const getEventEmails = (models, eventTrigger) => models.post
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

export const sendEmailsOnEvent = (models, eventTrigger, demandUserEmails, supplyUserEmails, emailData) =>
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
interface IEmailData {
	ACTION_URL?: string;
	EMAIL_SETTINGS_URL?: string;
	LISTING_TITLE?: string;
	MESSAGE_BODY?: string;
	SENDER_FIRST_NAME?: string;
	SENDER_LAST_NAME?: string;
	CONFIG?: { [configKey: string]: string };
}

export const getEmailAndSend = async (
	models: IVQModels,
	emailCode: TEmailCode,
	email: string[],
	emailData: IEmailData
) => {
	const config = await custProvider.getConfig(models);

	// in case emails are disabled... only the welcome and password reset email can be sent.
	if (emailCode !== EMAILS.WELCOME && emailCode !== EMAILS.PASSWORD_RESET && config.EMAILS_ENABLED !== "1") {
		return;
	}

	const emailBody = await getEmailBody(models, emailCode);

	const params: { subject?: string } = {};
	let compiledEmail;

	if (!emailBody) {
		// tslint:disable-next-line:no-console
		return console.error(`Email template "${emailCode}" has not been found`);
	}

	let emailDataObj: IEmailData;

	if (typeof emailData === "string") {
		emailDataObj = {
			ACTION_URL: emailData,
			CONFIG: config,
			EMAIL_SETTINGS_URL: `${config.DOMAIN}/app/account/notifications`,
			LISTING_TITLE: "<LISTING_TITLE NOT SPECIFIED>",
			MESSAGE_BODY: "<MESSAGE_BODY NOT SPECIFIED>",
			SENDER_FIRST_NAME: "<SENDER_FIRST_NAME NOT SPECIFIED>",
			SENDER_LAST_NAME: "<SENDER_LAST_NAME NOT SPECIFIED>"
		};
	} else {
		emailDataObj = emailData as IEmailData;
		emailDataObj.CONFIG = config;
		emailDataObj.ACTION_URL = (emailData as IEmailData).ACTION_URL || "<ACTION_URL NOT SPECIFIED>";
		emailDataObj.LISTING_TITLE = (emailData as IEmailData).LISTING_TITLE || "<LISTING_TITLE NOT SPECIFIED>";
		emailDataObj.SENDER_FIRST_NAME = (emailData as IEmailData).SENDER_FIRST_NAME || "<SENDER_FIRST_NAME NOT SPECIFIED>";
		emailDataObj.SENDER_LAST_NAME = (emailData as IEmailData).SENDER_LAST_NAME || "<SENDER_LAST_NAME NOT SPECIFIED>";
		emailDataObj.MESSAGE_BODY = (emailData as IEmailData).MESSAGE_BODY || "<MESSAGE_BODY NOT SPECIFIED>";
		emailDataObj.EMAIL_SETTINGS_URL =
			(emailData as IEmailData).EMAIL_SETTINGS_URL ||
			`${config.DOMAIN}/app/account/notifications`;
	}

	try {
		compiledEmail = ejs.compile(unescape(emailBody.body))(emailData);
	} catch (err) {
		// tslint:disable-next-line:no-console
		return console.error(err);
	}

	params.subject = emailBody.title;

	sendEmail(models, compiledEmail, typeof email === "string" ? [
		email
	] : email, params, (err: any) => {
		if (err) {
			// tslint:disable-next-line:no-console
			console.error(err);
		}
	});
};

export const sendNewTenant = (email, VERIFICATION_LINK) => {
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

export const sendTemplateEmail = (email, subject, body) => {
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
