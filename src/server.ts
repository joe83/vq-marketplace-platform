require('dotenv').config();

import routes from "./app/routes";
const pckg = require("../package.json")
const async = require("async");
const db = require("./app/models/models");
const tenantService = require("./app-tenant");
const workers = require("./app/workers");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const express = require("express");
const app = express();
const tenantApp = express();

let TENANT_ID;

console.log("Version: " + pckg.version)

const setTenantIdForTesting = (tenantId) => {
    TENANT_ID = tenantId;
};

const startServer = cb => {
    async.parallel([
        cb => {
            const appServer = app.listen(process.env.PORT, () => {
                const port = appServer.address().port;

                console.log(`VQ-Marketplace API listening at port ${port}. Supporting ${db.getTenantIds().length} tenants.`);

                cb();
            });
        },
        cb => {
            const tenantServer = tenantApp.listen(process.env.TENANT_PORT, () => {
                const port = tenantServer.address().port;
        
                console.log(`Tenant management API listening at port ${port}.`);

                cb();
            });
        }
    ], cb);
};

const startServerDeamons = () => {
    setInterval(() => {
        Object.keys(db.tenantRegister)
        .filter(tenantId => db.tenantConnections[tenantId])
        .forEach(tenantId => {
          const secsPassedSinceNotUsed =  (Date.now() / 1000) - db.tenantRegister[tenantId].established;

          console.log(`Tenant ${tenantId} not active since ${secsPassedSinceNotUsed}s`);

          if (secsPassedSinceNotUsed > 30) {
            console.log(`Closing tenant connection ${tenantId}`);

            db.tenantConnections[tenantId].seq.close();

            delete db.tenantConnections[tenantId];
         }
        });
    }, 10 * 1000);

    if (process.env.SHOW_MEMORY_USAGE) {
        setInterval(() => {
            const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        
            console.log(`[VQ-MARKETPLACE-PLATFORM] ${Math.round(usedMemory * 100) / 100} MB usage | ${Object.keys(db.tenantConnections).length} tenants`);
        }, 1 * 60 * 1000);
    }
};

const initTenants = cb => {
    async.waterfall([
        cb => {
            tenantService.getModels(async (err, tenantModels) => {
                if (err) {
                    return cb(err);
                }

                let rTenants;

                try {
                    rTenants = await tenantModels.tenant.findAll({
                        where: {
                            $and: [
                                { status: 3 },
                                { emailVerified: true }
                            ]
                        }
                    });
                } catch (err) {
                    return cb(err);
                }
                
                cb(null, rTenants);
            });
        },
        (tenants, cb) => {
            async.eachLimit(
                tenants,
                3,
                // we register it here, they are then lazy loaded when needed.
                async (tenant, cb) => {
                    console.log(`Registering tenant ${tenant.tenantId}`);
    
                    db.refreshTenantRegister(tenant.tenantId);
      
                    workers.registerWorkers(tenant.tenantId);
    
                    const models = db.get(tenant.tenantId);

                    console.log(`Synchronizing DB models for tenant: ${tenant.tenantId}`);

                    await models.seq.sync();

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
    ], cb);
};

const tenantConfigs = {};

const setupApp = async cb => {
	const initApp = app => {
		app.set("view engine", "ejs");
		app.set("json spaces", 2);
		app.set("superSecret", process.env.secret);
        app.use(cors());
		app.use(bodyParser.urlencoded({ extended: false }));
		app.use(bodyParser.json({ limit: "50mb" }));
	};


	initApp(app);
	initApp(tenantApp);

	// app.use(morgan("combined"));
	tenantApp.use(morgan("combined"));

	app.use(async (req, res, next) => {
		req.auth = {
			token: req.headers["x-auth-token"]
		};

		let tenantId = TENANT_ID || process.env.TENANT_ID;

		if (!tenantId) {
            const subdomains = req.subdomains;

            tenantId = subdomains[subdomains.length - 1];

            console.log(`Accessing ${subdomains}: ${tenantId}`);
		}

        req.models = db.get(tenantId);

		if (!req.models) {
			return res.status(400).send({
				code: "TENANT_NOT_FOUND"
			});
		}

        if (tenantConfigs[tenantId]) {
            const timeDiff =  Date.now() - tenantConfigs[tenantId].refreshed;

            // everything less than 2 minutes
            if ( timeDiff < 120 * 1000) {
                req.tenantConfig = tenantConfigs[tenantId].data;

                return next();
            }
        }

        let configArr;
        let configObj;

        try {
            configArr = await req.models.appConfig.findAll();

            configObj = {};
        } catch (err) {
            return res.status(500).send({
                code: "DB_ERROR",
                err
            });
        }

        configArr.forEach(configItem => {
            configObj[configItem.fieldKey] = configItem.fieldValue;
        });

        tenantConfigs[tenantId] = {
            refreshed: Date.now(),
            data: configObj
        };

        req.tenantConfig = configObj;

        return next();
	});

    console.log("-------------------------------------------------");
    const upperCaseENV = process.env.ENV.toUpperCase();
    console.log(`[${upperCaseENV} MODE] THIS API RUNS IN ${upperCaseENV} MODE..`);
    console.log("-------------------------------------------------");

    routes(app);

	tenantService.initRoutes(tenantApp, express);

	startServerDeamons();

	initTenants((err) => {
		if (err) {
            if (cb) {
                cb(err);
            }

			throw new Error(err);
		}

        cb = cb || function() {};

        startServer(cb);
	});
};

module.exports = {
    initTenants,
    setupApp,
    setTenantIdForTesting,
    startServerDeamons
};
