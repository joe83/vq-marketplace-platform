var API_VERSION = 3010;	
var PRODUCTION = typeof process.env.ST_ENV !== "undefined" ? process.env.ST_ENV : true;
var ENV = process.env.ST_ENV || "PROD";
var PORT = process.env.ST_PORT ||  process.env.PORT || 4060; // st-united
var PORT_TEST = 8080;

PORT = ENV === "PROD" ? PORT : PORT_TEST;

var REQUIRE_EMAIL_VERIFICATION = false; 

module.exports = {
 PORT : PORT,
 REQUIRE_EMAIL_VERIFICATION : REQUIRE_EMAIL_VERIFICATION,
 API_VERSION : API_VERSION,
 PRODUCTION : PRODUCTION,
 ENV: ENV,
};