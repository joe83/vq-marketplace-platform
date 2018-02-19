require('dotenv').config();

const async = require("async");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const args = require('yargs').argv;
const db = require("./app/models/models");
const tenantService = require("./app-tenant");
const workers = require("./app/workers");
const express = require("express");
const app = express();
const tenantApp = express();

const initApp = app => {
    app.set("view engine", "ejs");
    app.set("json spaces", 2);
    app.set("superSecret", process.env.SECRET);
    app.use(cors());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
};
initApp(app);
initApp(tenantApp);
// app.use(morgan("combined"));
tenantApp.use(morgan("combined"));
app.use((req, res, next) => {
    req.auth = {
        token: req.headers["x-auth-token"]
    };
    let tenantId;
    if (args.marketplace || process.env.TENANT_ID) {
        tenantId = args.marketplace || process.env.TENANT_ID;
    }
    else {
        const subdomains = req.subdomains;
        tenantId = subdomains[subdomains.length - 1];
        console.log(`Accessing ${tenantId}`);
	}
	args.env = args.env || process.env.ENV.toLowerCase;
    req.models = db.get(tenantId);
    if (!req.models) {
        return res.status(400).send({
            code: "TENANT_NOT_FOUND"
        });
    }
    next();
});
if (args.env.toLowerCase() === 'production') {
    console.log("-------------------------------------------------");
    console.log("[PRODUCTION MODE] THIS API RUNS IN PRODUCTION MODE..");
    console.log("-------------------------------------------------");
}
require("./app/routes.js")(app);
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
						{ status: 3 },
						{ emailVerified: true }
					]
				}
			})
			.then(rTenants => {
				cb(null, rTenants);
			}, cb);
		});
	},
	(tenants, cb) => {
		async.eachLimit(
			tenants,
			3,
			// we register it here, they are then lazy loaded when needed.
			(tenant, cb) => {
				console.log(`Registering tenant ${tenant.tenantId}`);

				db.refreshTenantRegister(tenant.tenantId);
  
				workers.registerWorkers(tenant.tenantId);

				cb();
					/**
					 	db.create(tenant.dataValues.tenantId, tenant.dataValues.marketplaceType, (err) => {
							if (err) {
								return cb(err);
							}

							workers
							.registerWorkers(tenant.dataValues.tenantId);

							cb(null, tenants);
						})
					*/
      		},
			cb
		);
	}
], (err) => {
    if (err) {
        throw new Error(err);
    }
    const appServer = app.listen(process.env.PORT, () => {
        const port = appServer.address().port;
        console.log(`VQ-Marketplace API listening at port ${port}. Supporting ${db.getTenantIds().length} tenants.`);
    });
    const tenantServer = tenantApp.listen(process.env.TENANT_PORT, () => {
        const port = tenantServer.address().port;
        console.log(`Tenant management API listening at port ${port}.`);
    });
});
setInterval(() => {
	Object.keys(db.tenantRegister)
	.filter(tenantId => db.tenantConnections[tenantId])
	.forEach(tenantId => {
	  const secsPassedSinceNotUsed =  (Date.now() / 1000) - db.tenantRegister[tenantId].established;
	  
	  console.log(`Tenant ${tenantId} not active since ${secsPassedSinceNotUsed}s`);

	  // is 15 sec ok?
	  if (secsPassedSinceNotUsed > 15) {
		console.log(`Closing tenant connection ${tenantId}`);

		db.tenantConnections[tenantId].seq.close();
  
		delete db.tenantConnections[tenantId];
	 }
	});
}, 1 * 5000);

setInterval(() => {
	const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
	if (process.env.SHOW_MEMORY_USAGE) {
		console.log(`[VQ-MARKETPLACE-API] ${ath.round(usedMemory * 100) / 100} MB usage | ${Object.keys(db.tenantConnections).length} tenants`);
	}
}, 1 * 60 * 1000);
