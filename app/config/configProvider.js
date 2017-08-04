const envVars = require('../../config/env-var.json');
const env = process.env.ST_ENV ? process.env.ST_ENV.toLowerCase() : 'local';
const config = require(`../../config/setups/${env}.json`);

console.log(config);

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
