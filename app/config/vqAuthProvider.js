const config = require("./configProvider.js")();
const ViciAuth = require('ViciAuthSDK')({
	appKey : config['viciauth.app_key'],
	apiKey : config['viciauth.api_key'],
}, null, null, {
	host: process.env.ST_ENV !== 'production' ? 'localhost' : null,
	port: process.env.ST_ENV !== 'production' ? 5000 : null
});

module.exports = ViciAuth;