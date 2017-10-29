const randomstring = require('randomstring');
const path = require('path');
const appDir = path.dirname(require.main.filename);
const envVars = require('../../config/env-var.json');
const argv = require('minimist')(process.argv.slice(2));

const env = process.env.ST_ENV ? process.env.ST_ENV.toLowerCase() : 'local';

const getConfig = () => {
	if (argv.config) {
		return require(`${appDir}${argv.config}`);
	}

	if (env === 'production') {
		// null is replaced by env variables
		return {
			"production": true,
			"port": null,
			"TENANT_APP_PORT": null,
			"VQ_DB_USER": null,
			"VQ_DB_PASSWORD": null,
			"VQ_DB_HOST": null,
			"secret" : null,
			"SERVER_URL" : null,
			"s3.bucket": null,
			"s3.region": 'eu-central-1',
			"s3.accessKeyId": null,
			"s3.secretAccessKey": null,
			"mandrill": null
		}
	}

	return {
		"production": false,
		"port": 8080,
		"TENANT_APP_PORT": 8081,
		"VQ_DB_USER": 'root',
		"VQ_DB_PASSWORD": 'kurwa',
		"VQ_DB_HOST": 'localhost',
		"secret" : 'test',
		"SERVER_URL" : 'http://vqtest.localhost:8080',
		"s3.bucket": null,
		"s3.region": 'eu-central-1',
		"s3.accessKeyId": null,
		"s3.secretAccessKey": null,
		"mandrill": null
	}
};

const config = getConfig();

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

// this will work only with one instance, but we use always 1 instance for testing
if (!config.secret) {
	config.secret = randomstring.generate(64);
}

module.exports = () => config;
