const async = require("async");
const tenantDb = require("./models");
const db = require("../app/models/models");
const workers = require("../app/workers");
const authCtrl = require("../app/controllers/authCtrl");


//Sercan: at the moment only the default config is exposed as JS file. services.json is an example (I did no changes to that file).
//we have to revise services and other configs to work like the default config (export them as functions)
//seeds need to be updated aswell to work with the new JS configs if we do this

//we can also use JSON files with placeholders that we can insert strings such as name, seo_title but that will need more work
//otherwise we have to use JS functions to dynamically create configs like I did
const marketplaceConfigs = {
  default: require('../marketplace-configs/default/config'), //default config that was passed at app-tenant/index.js
  services: require('../marketplace-configs/services/config.json'),
};

const deployNewMarketplace = (tenantId, apiKey, password, repeatPassword, marketplaceConfig, cb) => {
    const tenantModels = tenantDb.get("vq-marketplace");
    let marketplaceModels;

    let tenantRef;

    async.waterfall([
        cb => {
            tenantModels
                .tenant
                .findOne({
                    where: {
                        $and: [
                            { tenantId },
                            { apiKey }
                        ]
                    }
                })
                .then((rTenantRef) => {
                    if (!rTenantRef) {
                        return cb({
                            code: "TENANT_NOT_FOUND",
                            httpCode: 400
                        });
                    }

                    tenantRef = rTenantRef;

                    return cb();
                }, cb);
        },
        cb => {
            db.create(tenantId, err => {
                if (err) {
                    return cb(err);
                }
    
                workers.registerWorkers(tenantId);
    
                tenantRef
                    .update({
                        status: 2
                    })
                    .then(() => cb(), cb);
            });
        },
        cb => {

            //Sercan: this calls the object key with the marketplace type which returns the config object
            marketplaceConfig = marketplaceConfigs[marketplaceConfig](tenanRef);

            marketplaceModels = db.get(tenantId);

            marketplaceModels.appConfig
            .bulkCreateOrUpdate(
                Object.keys(marketplaceConfig)
                .map(fieldKey => {
                    return {
                        fieldKey,
                        fieldValue: marketplaceConfig[fieldKey]
                    };
                }),
                true,
                err => {
                    if (err) {
                        return cb(err);
                    }
        
                    cb();
                });
        },
        cb => {
            const userData = {
                email: tenantRef.email,
                firstName: tenantRef.firstName,
                lastName: tenantRef.lastName,
                userType: 0,
                isAdmin: true,
                accountType: "PRIVATE",
                password: password,
                repeatPassword: repeatPassword,
            };

            authCtrl
            .createNewAccount(marketplaceModels, userData, err => cb(err));
        },
        cb => {
            tenantRef
            .update({
                status: 3
            }).then(() => {
                console.log("Success! Created Marketplace, initial config and user account.");

              return cb();
            }, cb);
        }
    ], cb);
};

module.exports = {
    deployNewMarketplace
};
