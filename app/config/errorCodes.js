var errorCodes = {
	BAD_REQUEST: {
		httpCode: 400,
		code: "BAD_REQUEST",
		desc: "Review your request."
	},
	ALREADY_APPLIED : {
		httpCode: 400,
		codeNo: 4011,
		code: "ALREADY_APPLIED",
		desc: "You have already appied for this task."
	},
	PHONE_NUMBER_REQUIRED : {
		httpCode: 400,
		codeNo: 4011,
		code: "PHONE_NUMBER_REQUIRED",
		desc: "Phone number is required for this action."
	},
	EDUCATION_INFO_REQUIRED : {
		httpCode: 400,
		codeNo: 4011,
		code: "EDUCATION_INFO_REQUIRED",
		desc: "Education information is needed for this action"
	},
	PROFILE_INFO_REQUIRED : {
		httpCode: 400,
		codeNo: 4011,
		code: "PROFILE_INFO_REQUIRED",
		desc: "Profile information required for this action."
	},
	SUSPECTED_PRICING: {
		httpCode: 400,
		codeNo: 4011,
		code: "SUSPECTED_PRICING",
		desc: "Pricing could not be recalculated. Possible froud behaviour."
	},
	USER_BLOCKED: {
		httpCode: 401,
		codeNo: 4012,
		code: "BLOCKED",
		desc: "Tried to access with blocked account."
	},
	NOT_AUTHENTIFICATIED: {
		httpCode: 401,
		codeNo: 4011,
		code: "NOT_AUTHENTIFICATED",
		desc: "You are not authenticated. Log in."
	},
	MUST_BE_STRING: {
		httpCode: 400,
		codeNo: 4011,
		code: "MUST_BE_STRING",
		desc: "Field has to be of type 'string'"
	},
	UNIVERSITY_NOT_SUPPORTED: {
		httpCode: 400,
		codeNo: 4011,
		code: "UNIVERSITY_NOT_SUPPORTED",
		desc: "This university is not supported."
	},
	MUST_BE_FLOAT: {
		httpCode: 400,
		codeNo: 4011,
		code: "MUST_BE_FLOAT",
		desc: "Field has to be of type 'float'"
	},
	INVALID_COUNTRY_CODE: {
		httpCode: 400,
		codeNo: 4201,
		code: "INVALID_COUNTRY_CODE",
		desc: "Invalid country code."
	},
	INVALID_IBAN: {
		httpCode: 400,
		codeNo: 4001,
		code: "INVALID_IBAN",
		desc: "IBAN is invalid."
	},
	INVALID_BIC: {
		httpCode: 400,
		codeNo: 4001,
		code: "INVALID_BIC",
		desc: "BIC is invalid."
	},
	EMAIL_NOT_VERIFIED: {
		httpCode: 400,
		codeNo: 4101,
		code: "EMAIL_NOT_VERIFIED",
		desc: "Email has not beed verified"
	},
	NO_PAYMENT_METHOD: {
		httpCode: 400,
		codeNo: 4101,
		code: "NO_PAYMENT_METHOD",
		desc: "No payment method."
	},
	INSUFFICIENT_FUNDS: {
		httpCode: 400,
		codeNo: 4102,
		code: "INSUFFICIENT_FUNDS",
		desc: "The wallet's amount is too low."
	},
	//TASK
	INVALID_OFFER_TOKEN: {
		httpCode: 400,
		codeNo: 4001,
		code: "INVALID_OFFER_TOKEN",
		desc: "Offer token is invalid."
	},
	ACTION_NOT_POSSIBLE: {
		httpCode: 400,
		codeNo: 4001,
		code: "ACTION_NOT_POSSIBLE",
		desc: "Action not possible"
	},
	OFFER_ALREADY_USED: {
		httpCode: 400,
		codeNo: 4001,
		code: "OFFER_ALREADY_USED",
		desc: "Offer already used."
	},
	ASSISTANT_CANNOT_BE_ASSIGNED: {
		httpCode: 400,
		codeNo: 4000,
		code: "ASSISTANT_CANNOT_BE_ASSIGNED",
		desc: "Assistant cannot be assigned."
	},

	MOBILE_CODE_NOT_SUPPORTED: {
		httpCode: 400,
		codeNo: 4102,
		code: "MOBILE_CODE_NOT_SUPPORTED",
		desc: "Mobile code is not permitted. Try 49."
	},
	INVALID_MOBILE_NUMBER: {
		httpCode: 400,
		codeNo: 4102,
		code: "INVALID_MOBILE_NUMBER",
		desc: "Invalid mobile number."
	},
	// SIGNUP ERRORS
	SIGNUP_EMAIL_EXISTS: {
		httpCode: 400,
		codeNo: 4040,
		code: "SIGNUP_EMAIL_EXISTS",
		desc: "An account is already assigned to this email."
	},
	SIGNUP_EMAIL_INITIAL: {
		httpCode: 400,
		codeNo: 4041,
		code: "SIGNUP_EMAIL_INITIAL",
		desc: "Provide an email address to sign up."
	},
	SIGNUP_FIRST_NAME_INITIAL: {
		httpCode: 400,
		codeNo: 4042,
		code: "SIGNUP_FIRST_NAME_INITIAL",
		desc: "Provide first name to sign up."
	},
	SIGNUP_LAST_NAME_INITIAL: {
		httpCode: 400,
		codeNo: 4043,
		code: "SIGNUP_LAST_NAME_INITIAL",
		desc: "Provide last name to sign up."
	},
	SIGNUP_PASSWORD_INITIAL: {
		httpCode: 400,
		codeNo: 4044,
		code: "SIGNUP_PASSWORD_INITIAL",
		desc: "Provide password to sign up."
	},
	SIGNUP_MOBILE_INITIAL: {
		httpCode: 400,
		codeNo: 4045,
		code: "SIGNUP_PASSWORD_INITIAL",
		desc: "Provide mobile to sign up."
	},
	SIGNUP_MOBILE_CODE_INITIAL: {
		httpCode: 400,
		codeNo: 4046,
		code: "SIGNUP_MOBILE_CODE_INITIAL",
		desc: "Provide mobile code to sign up."
	},
	SIGNUP_MOBILE_NUMBER_INITIAL: {
		httpCode: 400,
		codeNo: 4047,
		code: "SIGNUP_MOBILE_NUMBER_INITIAL",
		desc: "Provide mobile number to sign up."
	},
	SIGNUP_ACCOUNT_TYPE_INITIAL: {
		httpCode: 400,
		codeNo: 4048,
		code: "SIGNUP_ACCOUNT_TYPE_INITIAL",
		desc: "Account Type is initial."
	},
	SIGNUP_ACCOUNT_TYPE_UNKNOWN: {
		httpCode: 400,
		codeNo: 4049,
		code: "SIGNUP_ACCOUNT_TYPE_UNKNOWN",
		desc: "Account Type is unknown."
	},
	// SOME SOME
	MALFORMATTED_PARAMETERS: {
		httpCode: 400,
		codeNo: 4103,
		code: "MALFORMATTED_PARAMETERS",
		desc: "Wrong formatting of request parameters."
	},

	WALLET_NOT_ASSIGNED : {
		httpCode: 400,
		codeNo: 4000,
		code: "WALLET_NOT_ASSIGNED",
		desc: "No wallet has been assigned to user."
	},
	
	WALLET_NOT_FOUND: {
		httpCode: 400,
		codeNo: 5000,
		code: "WALLET_NOT_FOUND",
		desc: "User's wallet has not been found."
	},
	
	USER_NOT_FOUND: {
		httpCode: 400,
		codeNo: 4000,
		code: "USER_NOT_FOUND",
		desc: "User not found."
	},
	TASK_NOT_FOUND: {
		httpCode: 400,
		codeNo: 4201,
		code: "TASK_NOT_FOUND",
		desc: "Task with this ID could not be found in the database."
	},
	INVOICE_KEY_NOT_FOUND: {
		httpCode: 400,
		codeNo: 4201,
		code: "INVOICE_KEY_NOT_FOUND",
		desc: "Invoice key has not been found."
	},
	NOT_AUTHORIZED: {
		httpCode: 401,
		codeNo: 4001,
		code: "NOT_AUTHORIZED",
		desc: "You are not authorized for this action."
	},
	DATABASE_ERROR: {
		httpCode: 500,
		codeNo: 5021,
		code: "DATABASE_ERROR",
		desc: "Request to database resulted in an error."
	},
	INITIAL_PARAMETERS: {
		httpCode: 400,
		codeNo: 5400,
		code: "INITIAL_PARAMETERS",
		desc: "Initial parameters in function implementation."
	},
	TASK_OWNER_NOT_FOUND: {
		httpCode: 500,
		codeNo: 5400,
		code: "TASK_OWNER_NOT_FOUND",
		desc: "Task owner has not been found."
	},
	ASSIGNED_USER_NOT_FOUND: {
		httpCode: 500,
		codeNo: 5400,
		code: "ASSIGNED_USER_NOT_FOUND",
		desc: "Task owner has not been found."
	},
	UNKNOWN_ERROR: {
		httpCode: 500,
		codeNo: 5031,
		code: "UNKNOWN_ERROR",
		desc: "Unknown Internal Server Error."
	},
	INVALID_VERIFICATION_TOKEN: {
		httpCode: 400,
		codeNo: 4001,
		code: "INVALID_VERIFICATION_TOKEN",
		desc: "Invalid verification token"
	},
	//TASK
	PAYMENT_PROVIDER_ERROR: {
		httpCode: 502,
		codeNo: 5021,
		code: "PAYMENT_PROVIDER_ERROR",
		desc: "Unknown Payment Provider Error."
	},
	DEPOSIT_AMOUNT_NOT_ALLOWED: {
		httpCode: 400,
		codeNo: 4021,
		code: "DEPOSIT_AMOUNT_NOT_ALLOWED",
		desc: "Deposit Amount not allowed."
	},
	//MANGOPAY
	MANGOPAY_USER_NOT_FOUND: {
		httpCode: 500,
		codeNo: 5021,
		code: "MANGOPAY_USER_NOT_FOUND",
		desc: "Mangopay user not found."
	},
	NO_BILLING_ADDRESS: {
		httpCode: 400,
		codeNo: 4021,
		code: "NO_BILLING_ADDRESS",
		desc: "Billing address is missing."
	},
	NO_TAX_NUMBER_ASSISTANT: {
		httpCode: 400,
		codeNo: 4031,
		code: "NO_TAX_NUMBER_ASSISTANT",
		desc: "Enter your tax number to accept tasks."
	}
};


module.exports = errorCodes;