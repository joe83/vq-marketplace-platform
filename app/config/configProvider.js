const envVars = require('../../config/env-var.json');
const env = process.env.ST_ENV ? process.env.ST_ENV.toLowerCase() : 'local';
var config;

if (env === 'production') {
	// null is replaced by env variables
	config = {
		"production": true,
		"port": null,
		"db": null,
		"secret" : null,
		"viciauth.app_key": null,
		"viciauth.api_key": null,
		"viciauth.host": null,
		"viciauth.port": null,
		"s3.bucket": null,
		"s3.region": null,
		"s3.accessKeyId": null,
		"s3.secretAccessKey": null,
		"mandrill": null,
		"listly.dbHostName": null,
		"listly.dbPort": null,
		"listly.dbPassword": null,
		"listly.dbDatabase": null,
		"listly.mandrillSecretKey": null
	}
} else {
	config = require(`../../config/setups/${env}.json`);
}

Object.keys(config)
.forEach(configKey => {
	var configValue;
	
	if (config[configKey] === null) {
		config[configKey] = process.env[envVars[configKey]];

		return;
	}

	if (config[configKey] && config[configKey].constructor === Array) {
			for (var index = 0; index < config[configKey].length; index++) {
				configValue = config[configKey][index];

				if (configValue === ':') {
					if (process.env[envVars[configKey]]) {
						console.log(`Setting config.${configKey} from env var to ${process.env[envVars[configKey]]}`);
						config[configKey] = process.env[envVars[configKey]];

						return;
					}
				}
				
				if (typeof configValue === 'number') {
					config[configKey] = configValue;

					return;
				}

				var splitted = configValue.split(':');

				if (splitted[1]) {
					if (process.env[envVars[splitted[1]]]) {
						console.log(`Setting config.${configKey} from env var to ${process.env[envVars[splitted[1]]]}`);
						config[configKey] = process.env[envVars[splitted[1]]];

						return;
					}
				} else {
					if (config[configKey].length === index - 1) {
						config[configKey] = splitted[0];

						return;
					} 
				}
			}
	}
});

config.requireEmailVerification = config.production === true || config.production === "true";

module.exports = () => config;
