require('dotenv').config();

const async = require("async");
const db = require("./app/models/models");
const tenantService = require("./app-tenant");
// const workers = require("./app/workers");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const express = require("express");
const app = express();
const tenantApp = express();

let TENANT_ID;

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
    
          // is 15 sec ok?
          if (secsPassedSinceNotUsed > 15) {
            console.log(`Closing tenant connection ${tenantId}`);
    
            db.tenantConnections[tenantId].seq.close();
      
            delete db.tenantConnections[tenantId];
         }
        });
    }, 1 * 5000);
    
    if (process.env.SHOW_MEMORY_USAGE) {
        setInterval(() => {
            const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        
            console.log(`[VQ-MARKETPLACE-API] ${Math.round(usedMemory * 100) / 100} MB usage | ${Object.keys(db.tenantConnections).length} tenants`);
        }, 1 * 60 * 1000);
    }
};

const initTenants = cb => {
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
      
                    // workers.registerWorkers(tenant.tenantId);
    
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

const setupApp = cb => {
	const initApp = app => {
		app.set("view engine", "ejs");
		app.set("json spaces", 2);
		app.set("superSecret", process.env.secret);
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

		let tenantId = TENANT_ID || process.env.TENANT_ID;

		if (!tenantId) {
            const subdomains = req.subdomains;

            tenantId = subdomains[subdomains.length - 1];

            console.log(`Accessing ${tenantId}`);
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

        req
        .models
        .appConfig
        .findAll()
        .then(configArr => {
            const configObj = {};

            configArr.forEach(configItem => {
                configObj[configItem.fieldKey] = configItem.fieldValue;
            });

            tenantConfigs[tenantId] = {
                refreshed: Date.now(),
                data: configObj
            };

            req.tenantConfig = configObj;

            console.log(req.tenantConfig);

            return next();
        }, err => {
            res.status(500).send({
                code: "DB_ERROR",
                err
            });
        });
	});

    console.log("-------------------------------------------------");
    const upperCaseENV = process.env.ENV.toUpperCase();
    console.log(`[${upperCaseENV} MODE] THIS API RUNS IN ${upperCaseENV} MODE..`);
    console.log("-------------------------------------------------");

	require("./app/routes.js")(app);

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
