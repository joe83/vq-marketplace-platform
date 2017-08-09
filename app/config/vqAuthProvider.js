const config = require("./configProvider.js")();
const ViciAuth = require('ViciAuthSDK')({
	appKey : config['viciauth.app_key'],
	apiKey : config['viciauth.api_key'],
}, null, null, {
	host: config['viciauth.host'] || 'localhost',
	port: config['viciauth.port'] || 5000
});

module.exports = ViciAuth;