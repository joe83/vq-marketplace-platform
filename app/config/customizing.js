var errorCodes = require("./errorCodes");

var statusList = {
	open: 0,
	assigned: 1,
	markedDoneByAssistant: 2,
	markedDone: 3,
	settled: 4,
	cancelled: 101,
	cancelledWithProvision: 102,
	deactivated: 103
};

var changeHistory = {
	TASK_CREATED: {
		code: "TASK_CREATED"
	},
	ASSISTANT_APPLIED: {
		code: "ASSISTANT_APPLIED"
	},
	TASK_APPLICATION_REVOKED: {
		code: "TASK_APPLICATION_REVOKED"
	},
	TASK_ASSIGNED: {
		code: "TASK_ASSIGNED"
	},
    ASSISTANT_CHOSEN : {
        code : "ASSISTANT_CHOSEN" // for choosing of many many assistants :D
    },
	TASK_MARKED_DONE_BY_ASSISTANT: {
		code: "TASK_MARKED_DONE_BY_ASSISTANT"
	},
	TASK_MARKED_DONE: {
		code: "TASK_MARKED_DONE"
	},
	TASK_SETTLED: {
		code: "TASK_SETTLED"
	},
	TASK_CANCELLED: {
		code: "TASK_CANCELLED"
	},
	TASK_CANCELLED_WITH_PROVISION: {
		code: "TASK_CANCELLED_WITH_PROVISION"
	},
	TASK_CANCELLED_BY_ASSISTANT: {
		code: "TASK_CANCELLED_BY_ASSISTANT"
	},
	TASK_ASSISTANT_NOT_ACCEPTED: {
		code: "TASK_ASSISTANT_NOT_ACCEPTED"
	},
	TASK_RATED: {
		code: "TASK_RATED"
	}
};

var accountTypes = {
	ADMIN: 'ADMIN',
	PRIVATE: 'PRIVATE',
	LEGAL: 'LEGAL',
	ASSISTANT: 'ASSISTANT'
};

var emailTemplates = {
	WELCOME : "studentask-email-customer-welcome",
	WELCOME_ASSISTANT : "studentask-email-assistant-welcome",
	PW_RECOVERY : "studentask-email-pw-recovery",
	SERVICE_PROVIDER_INVOICE: "studentask-email-service-provider-invoice-en",
	SERVICE_PROVIDER_INVOICE_COPY : "studentask-email-service-provider-invoice-copy-en",
	PROVISION_INVOICE: "studentask-email-provision-invoice-en",
	EMAIL_VERIFICATION: 'studentask-email-verification',
	EMAIL_VERIFICATION_INSTANT_TASK : "studentask.email.verification.instant-task",
	NEW_TASK_INTERNAL : "studentask-email-new-task-internal",
	CONFIRMED_BY_ASSISTANT : 'studentask-email-confirmed-by-assistant',
};



module.exports = {
	mode: 'private', //private/firms
	timezone: 'Europe/Berlin',
	timeFormat: 'HH:mm',
	dateFormat: 'DD.MM.YYYY HH:mm',
	dateOnlyFormat : "DD.MM.YYYY",
	domainUrl: 'https://studentask.de/',
	changeHistory: changeHistory,
	accountTypes: accountTypes,
	statusList: statusList,
	errorCodes: errorCodes,
	emailTemplates: emailTemplates,
};