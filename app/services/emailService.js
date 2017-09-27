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

const EMAILS = {
	WELCOME: 'welcome',
	PASSWORD_RESET: 'password-reset'
};

const checkIfShouldSendEmail = (emailCode, userId, cb, shouldNotCb) => models
	.userProperty
	.findOne({
		where: {
			$and: [
				{
					propKey: 'EMAIL_' + emailCode,
				}, {
					propValue: '1'
				}, {
					userId
				}
			]
		}
	})
	.then(isDeactived => {
		if (!isDeactived) {
			cb();
		} else {
			if (shouldNotCb) {
				shouldNotCb();
			}
		}
	}, err => {
		console.error(err);
	});

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

		if (!emailBody) {
			return console.error(`Email template "${emailCode}" has not been found`);
		}

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

const sendResetPasswordEmail = (email, ACTION_URL) => {
	getEmailBody(EMAILS.PASSWORD_RESET)
	.then(emailBody => {
		const params = {};

		const compiledEmail = ejs.compile(unescape(emailBody.body))({
			ACTION_URL
		});

		params.subject = emailBody.title;

		return sendEmail(compiledEmail, [
			email
		], params, (err, res) => {
			if (err) {
				console.error(err);
			}
		});
	});
};

const sendWelcome = (user, VERIFICATION_LINK) => {
	getEmailBody(EMAILS.WELCOME)
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

const getMessagePrototype = () => new Promise((resolve, reject) => {
	custProvider
	.getConfig()
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
			console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
	
			return callback(e);
		});	
	});
}

module.exports = {
	EMAILS,
	checkIfShouldSendEmail,
	getEmailAndSend,
	sendEmail,
	sendWelcome
};
