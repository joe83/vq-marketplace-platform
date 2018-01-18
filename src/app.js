const async = require("async");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const fs = require('fs');
const path = require('path');
const args = require('yargs').argv;
const appRoot = require('app-root-path').path;
const db = require("./app/models/models");
const tenantService = require("./app-tenant");
const workers = require("./app/workers");
const express = require("express");
const app = express();
const tenantApp = express();

const generateConfig = () => {
  if (!args.config) {
    console.log("ERROR: Please provide a config file as an argument!")
  }

  if (!args.env) {
    console.log("ERROR: Please provide an environment as an argument!")
  }
  
  if(!fs.existsSync(path.join(appRoot, args.config))) {
    console.log("Config file was not found at ", path.join(appRoot, args.config));
    return null;
  } else {
   return fs.readFileSync(path.join(appRoot, args.config), "utf8");
  }
}

if (!generateConfig()) {
  return;
}

const config = JSON.parse(generateConfig());

const initApp = app => {
    app.set("view engine", "ejs");
    app.set("json spaces", 2);
    app.set("superSecret", config[args.env.toUpperCase()]["VQ_MARKETPLACE_API"]["SECRET"]);
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
    if (args.TENANT_ID || config[args.env.toUpperCase()]["VQ_MARKETPLACE_API"]["TENANT_ID"]) {
        tenantId = args.TENANT_ID || config[args.env.toUpperCase()]["VQ_MARKETPLACE_API"]["TENANT_ID"];
    }
    else {
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
    next();
});
if (args.env === 'production') {
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
        async.eachLimit(tenants, 10, (tenant, cb) => {
            db.create(tenant.dataValues.tenantId, tenant.dataValues.marketplaceType, (err) => {
                if (err) {
                    return cb(err);
                }
                workers
                    .registerWorkers(tenant.dataValues.tenantId);
                cb(null, tenants);
            });
        }, cb);
    }
], (err) => {
    if (err) {
        throw new Error(err);
    }
    const appServer = app.listen(config[args.env.toUpperCase()]["VQ_MARKETPLACE_API"]["PORT"], () => {
        const port = appServer.address().port;
        console.log(`VQ-Marketplace API listening at port ${port}. Supporting ${db.getTenantIds().length} tenants.`);
    });
    const tenantServer = tenantApp.listen(config[args.env.toUpperCase()]["VQ_MARKETPLACE_API"]["TENANT_PORT"], () => {
        const port = tenantServer.address().port;
        console.log(`Tenant management API listening at port ${port}.`);
    });
});
setInterval(() => {
    const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    if (config[args.env.toUpperCase()]["VQ_MARKETPLACE_API"]["SHOW_MEMORY_USAGE"]) {
      console.log(`[VQ-MARKETPLACE-API] The process is consuming now approximately ${Math.round(usedMemory * 100) / 100} MB memory.`);
    }
}, 5000);
