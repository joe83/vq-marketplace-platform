const async = require("async");
const cors = require("cors");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const config = require("./app/config/configProvider.js")();
const app = require('express')();
const mysql = require('mysql2');
const db = require('./app/models/models');

app.set('view engine', 'ejs');
app.set('json spaces', 2);
app.set('superSecret', config.secret);
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
	req.auth = {
		token: req.headers['x-auth-token']
	};

	const subdomains = req.subdomains;

	const tenantId = subdomains[0] || 'vqtest22';

	req.models = db.get(tenantId);

	next();
});

if (config.production === true) {
	console.log("-------------------------------------------------");
	console.log("[PRODUCTION MODE] THIS API RUNS IN PRODUCTION MODE..");
	console.log("-------------------------------------------------");
}

require('./app/routes.js')(app);

const tenants = [
	"vqtest22"
];

async.waterfall([
	cb => {
		async.each(tenants, (tenant, cb) => db.create(tenant, cb), cb);
	},
	cb => {
		async.each(tenants, (tenant, cb) => {
			require('./app/workers/index.js')
				.registerWorkers(tenant);
			
			cb();
		}, cb);
	}
], err => {
	if (err) {
		throw new Error(err);
	}

	const server = app.listen(config.port, () => {
		var host = server.address().address;
		var port = server.address().port;

		console.log(`VQ-Marketplace API listening at port ${port}. Supporting ${tenants.length} tenants.`);

		setInterval(() => {
			const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;

			console.log(`[VQ-MARKETPLACE-API] The process is consuming now approximately ${Math.round(usedMemory * 100) / 100} MB memory.`);
		}, 5000);
	});
});
