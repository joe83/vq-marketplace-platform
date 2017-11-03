const async = require("async");
const cors = require("cors");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const config = require("./app/config/configProvider.js")();
const mysql = require('mysql2');
const db = require('./app/models/models');
const tenantService = require('./app-tenant');
const workers = require('./app/workers');
const express = require('express');
const app = express();
const tenantApp = express();

const initApp = app => {
	app.set('view engine', 'ejs');
	app.set('json spaces', 2);
	app.set('superSecret', config.secret);
	app.use(cors());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
};

initApp(app);
initApp(tenantApp);

app.use((req, res, next) => {
	req.auth = {
		token: req.headers['x-auth-token']
	};

	let tenantId;

	if (process.env.TENANT_ID) {
		tenantId = process.env.TENANT_ID
	} else {
		const subdomains = req.subdomains;
		
		tenantId = subdomains[subdomains.length - 1];

		console.log(`Accessing ${tenantId}`);
	}

	req.models = db.get(tenantId);

	if (!req.models) {
		return res.status(400).send({
			code: 'TENANT_NOT_FOUND'
		});
	}

	next();
});

if (config.production === true) {
	console.log("-------------------------------------------------");
	console.log("[PRODUCTION MODE] THIS API RUNS IN PRODUCTION MODE..");
	console.log("-------------------------------------------------");
}

require('./app/routes.js')(app);

tenantService.initRoutes(tenantApp, express);

async.waterfall([
	cb => {
		tenantService.getModels((err, tenantModels) => {
			if (err) {
				return cb(err);
			}

			tenantModels
			.tenant
			.findAll({
				where: {
					$and: [
						{ status: 2 },
						{ emailVerified: true }
					]
				}
			})
			.then(rTenants => {
				const tenants = rTenants.map(_ => _.tenantId);

				cb(null, tenants);
			}, cb);
		})
	},
	(tenants, cb) => {
		async.eachLimit(
			tenants,
			10,
			(tenant, cb) => db.create(tenant, (err) => {
				if (err) {
					return cb(err);
				}

				require('./app/workers/index.js')
				.registerWorkers(tenant);

				cb(null, tenants);
			}),
			cb
		);
	}
], (err, tenants) => {
	if (err) {
		throw new Error(err);
	}

	const appServer = app.listen(config.port, () => {
		var host = appServer.address().address;
		var port = appServer.address().port;

		console.log(`VQ-Marketplace API listening at port ${port}. Supporting ${db.getTenantIds().length} tenants.`);
	});

	const tenantServer = tenantApp.listen(config.TENANT_APP_PORT, () => {
		var host = tenantServer.address().address;
		var port = tenantServer.address().port;

		console.log(`Tenant management API listening at port ${port}.`);
	});
});

setInterval(() => {
	const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;

	console.log(`[VQ-MARKETPLACE-API] The process is consuming now approximately ${Math.round(usedMemory * 100) / 100} MB memory.`);
}, 5000);