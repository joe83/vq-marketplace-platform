const ViciAuth = require('ViciAuthSDK')({
	appKey : process.env.ST_VA_APP_KEY,
	apiKey : process.env.ST_VA_API_KEY,
}, null, null, {
	host: process.env.ST_ENV !== 'production' ? 'localhost' : null,
	port: process.env.ST_ENV !== 'production' ? 5000 : null
});

module.exports = ViciAuth;