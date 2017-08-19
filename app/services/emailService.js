const randtoken = require('rand-token');
const stRender = require("st-render");
const ejs = require("ejs");
const mandrill = require('mandrill-api/mandrill');
const config = require("../config/configProvider.js")();
const cust = require("../config/customizing.js");
const custProvider = require("../config/custProvider.js");
var templateDir = __dirname + "/../../email-templates/templates/";
var layoutPath = __dirname + "/../../email-templates/layout.ejs";
const unescape = require('unescape');

var mandrill_client = new mandrill.Mandrill(config.mandrill);
var renderer = stRender(templateDir, layoutPath);

const models = require("../models/models.js");

const getEmailBody = code => models.post
	.findOne({ 
		where: {
			$and: [
				{
					type: 'email',
				}, {
					code
				}
			]
	}});

const getEmailAndSend = (emailCode, email, ACTION_URL) => getEmailBody(emailCode)
	.then(emailBody => {
		const params = {};
		var compiledEmail;

		try {
			compiledEmail = ejs.compile(unescape(emailBody.body))({
				ACTION_URL
			});
		} catch (err) {
			return console.error(err);
		}
		

		params.subject = emailBody.title;

		return sendEmail(compiledEmail, [
			email
		], params, (err, res) => {
			if (err) {
				console.error(err);
			}
		});
	});

const sendWelcome = (user, VERIFICATION_LINK) => {
	getEmailBody('welcome')
	.then(emailBody => {
		const params = {};

		const compiledEmail = ejs.compile(unescape(emailBody.body))({
			VERIFICATION_LINK
		});

		params.subject = emailBody.title;

		return sendEmail(compiledEmail, [
			user.emails[0]
		], params, (err, res) => {
			if (err) {
				console.error(err);
			}
		});
	});
};

function notifyAdminAboutNewUser (emails, user) {
	custProvider.getConfig().then(config => {
		var emailHTML = renderer("admin-new-user", {
			user: user,
			config: config
		});

		var params = {};

		params.subject = "New User on TalentWand";

		sendEmail(emailHTML, emails, params, (err, res) => {
			if (err) {
				console.error(err);
			}	
		});
	});
}

function sendNewApplicationReceived (data) {
	custProvider.getConfig().then(config => {
		var emailHTML = renderer("application-received", {
			config: config,
			applicant : data.applicant,
			task : data.task,
			taskOwner : data.taskOwner,
			application : data.application
		});

		var email;
		var params = {};

		try {
			email = data.taskOwner.emails[0].address;
		} catch(e) {
			return console.error("[ERROR] [EmailService] No email assigned!", e)
		}

		params.subject = "Neue Anfrage";
		sendEmail(emailHTML, [ email ], params, (err, res) => {
			if (err) {
				console.error(err);
			}	
		});
	});
}

function sendNewChatMessageReceived (data) {
	custProvider.getConfig()
	.then(config => {
		var emailHTML = renderer("new-message", {
			config: config,
			token: data.password,
			sender: data.sender,
			receiver: data.receiver,
			message: data.message,
			task: data.task
		});

		var email;
		var params = {};

		try {
			email = data.receiver.emails[0].address;
		} catch(e) {
			return console.error("[ERROR] [EmailService] No email assigned!", e)
		}

		params.subject = `New message: ${data.task.title}`;

		sendEmail(emailHTML, [ email ], params, (err, res) => {
			if (err) {
				console.error(err);
			}	
		});
	});
}

function sendApplicationConfirmation (data) {
	custProvider.getConfig().then(config => {
		var emailHTML = renderer("application-confirmation", {
			config: config,
			applicant: data.applicant,
			task: data.task,
			taskOwner: data.taskOwner,
			application: data.application
		});

		var email;

		try {
			email = data.applicant.emails[0].address;
		} catch (e) {
			return console.error("[ERROR] [EmailService] No email assigned!", e)
		}
		var params = {};

		params.subject = "Bestätigung: Ihre Anfrage";

		sendEmail(emailHTML, [email], params, (err, res) => err && console.error(err));
	});
}

function sendNewRelevantTaskInfo (emails, Task) {
	custProvider.getConfig().then(config => {
		var emailHTML = renderer("new-task", {
			config: config,
			task: Task
		});

		var params = {};

		params.subject = "Neue Aufgabe!";

		sendEmail(emailHTML, emails, params, (err, res) => err && console.error(err));
	});
}


const getMessagePrototype = () => new Promise((resolve, reject) => {
	models
		.appConfig
		.findAll()
		.then(config => {
			return resolve({
				"from_email": "noreply@vq-labs.com",
				"from_name": config.NAME || "VQ LABS",
				"to": [ ],
				"headers": {
					"Reply-To": config.SUPPORT_EMAIL
				},
				"important": false,
				"global_merge_vars": [],
				"metadata": {
					"website": config.DOMAIN
				},
				"recipient_metadata": [{}],
			});
		}, reject);
});

function sendEmail (html, tEmails, params, callback) {
	getMessagePrototype()
	.then(message => {
		message.subject = params.subject;
		message.html = html;
		message.text = html;
		message.to = tEmails.map(email => { 
			return { email, type: "to" };
		});
	
		var lAsync = false;
		var ip_pool = "Main Pool";
	
		mandrill_client.messages
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
			console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
	
			return callback(e);
		});	
	});
}

function sendFromTemplate(templateName, message, callback) {
	console.log("[INFO] [EmailService.sendFromTemplate] Sending template %s",templateName);
	var mandrillAsync = false;
	var ip_pool = "Main Pool";
	
	var paramDO = {
		"template_name": templateName,
		"template_content": [],
		"message": message,
		"async": mandrillAsync,
		"ip_pool": ip_pool
	};

	mandrill_client.messages.sendTemplate(paramDO, function(result) {
		console.log(result);
		callback(null, result);
	}, function(e) {
		console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
		callback(e);
	});
}

function sendEmailVerificatiton (params, callback) {
	console.log("[EmailVerification]",params);
	var message = getMessagePrototype();

	message.to.push({
		"email": params.email,
		"type": "to"
	});
	message.recipient_metadata.push({
		"rcpt": params.email,
	});

	var verification_link = cust.domainUrl + "verify/email/" + params.token;

	console.log(verification_link);
	message.global_merge_vars.push({
		"name": "email_verification_link",
		"content": verification_link
	});

	var templateName = cust.emailTemplates.EMAIL_VERIFICATION;
	
	if (params.instantTask) {
		templateName = cust.emailTemplates.EMAIL_VERIFICATION_INSTANT_TASK;
	}

	console.log("[INFO] [EmailService] Sending template %s",templateName);
	sendFromTemplate(templateName, message, function(err, result) {
		callback(err, result);
	});
}


var sendInvoice = function(params, opts, callback) {


	var message = getMessagePrototype();
	message.to.push({
		"email": params.email,
		"type": "to"
	});
	message.recipient_metadata.push({
		"rcpt": params.email,
	});
	message.attachments = [];
	var attachment = {
		type: "application/pdf",
		name: params.attachmentName,
		content: params.attachmentBase64Content,
	};


	message.attachments.push(attachment);

	var templateName;
	if (opts.type == "PROVISION") {
		templateName = cust.emailTemplates.PROVISION_INVOICE;
	}

	if (opts.type == "SERVICE_PROVIDER") {
		templateName = cust.emailTemplates.SERVICE_PROVIDER_INVOICE;
	}

	if (opts.type == "SERVICE_PROVIDER_COPY") {
		templateName = cust.emailTemplates.SERVICE_PROVIDER_INVOICE_COPY;
	}

	if (!templateName) {
		return callback("opts.type initial, template type");
	}
	sendFromTemplate(templateName, message, function(err, result) {
		if (err) {
			console.log(err);
			return callback(err);
		} else {
			return callback(null, result);
		}

	});

};

var sendAssistantServiceInvoice = function(params, callback) {


	var message = getMessagePrototype();
	message.to.push({
		"email": params.email,
		"type": "to"
	});
	message.recipient_metadata.push({
		"rcpt": params.email,
	});
	message.attachments = [];
	var attachment = {
		type: "application/pdf",
		name: params.attachmentName,
		content: params.attachmentBase64Content,
	};


	message.attachments.push(attachment);

	sendFromTemplate(cust.emailTemplates.PROVISION_INVOICE, message, function(err, result) {
		if (err) {
			console.log(err);
			return callback(err);
		} else {
			return callback(null, result);
		}

	});

};



var sendPasswordRecovery = function(params, callback) {

	// email, token
	var message = getMessagePrototype();

	message.to.push({
		"email": params.email,
		"type": "to"
	});
	message.recipient_metadata.push({
		"rcpt": params.email,
	});


	var pw_reset_link = cust.domainUrl + "pw-recovery/reset-password?token=" + params.token;
	message.global_merge_vars.push({
		"name": "pw_reset_link",
		"content": pw_reset_link
	});

	sendFromTemplate(cust.emailTemplates.PW_RECOVERY, message, function(err, result) {
		callback(err, result);
	});

};

var sendEmailTemplate = function(tmpl, email){
	
	
	var message = getMessagePrototype();

	message.to.push({
		"email": email,
		"type": "to"
	});
	message.recipient_metadata.push({
		"rcpt": email,
	});

	sendFromTemplate(tmpl, message, function(err, result) {
		if(err){
			console.error(err);
		}
	});
};



const sendNewTaskInternal = function() {

	var message = getMessagePrototype();
	message.to.push({
		"email": "adrian.barwicki@viciqloud.com",
		"type": "to"
	});
	message.recipient_metadata.push({
		"rcpt": "adrian.barwicki@viciqloud.com",
	});
	message.to.push({
		"email": "anicaliss@gmail.com",
		"type": "to"
	});
	message.recipient_metadata.push({
		"rcpt": "anicaliss@gmail.com",
	});
	sendFromTemplate(cust.emailTemplates.NEW_TASK_INTERNAL, message, function(err) {
		if (err) {
			console.error(err);
		} else {
			console.log("internal email about new task has been sent");
		}
	});

};

module.exports = {
	getEmailAndSend,
	notifyAdminAboutNewUser: notifyAdminAboutNewUser,
	sendEmail: sendEmail,
	sendEmailTemplate: sendEmailTemplate,
	sendNewTaskInternal: sendNewTaskInternal,
	sendWelcome: sendWelcome,
	sendPasswordRecovery: sendPasswordRecovery,
	sendAssistantServiceInvoice: sendAssistantServiceInvoice,
	sendEmailVerificatiton: sendEmailVerificatiton,
	sendApplicationConfirmation: sendApplicationConfirmation,
	sendNewApplicationReceived: sendNewApplicationReceived,
	sendNewRelevantTaskInfo: sendNewRelevantTaskInfo,
	sendNewChatMessageReceived: sendNewChatMessageReceived
};