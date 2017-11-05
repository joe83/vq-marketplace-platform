const async = require("async");
const tenantDb = require('./models');
const db = require('../app/models/models');
const workers = require('../app/workers');
const authCtrl = require("../app/controllers/authCtrl");

const deployNewMarketplace = (tenantId, apiKey, password, repeatPassword, cb) => {
    const tenantModels = tenantDb.get('vq-marketplace');

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
                        })
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

            tenantRef
            .update({
                status: 3
            }).then(() => {
                console.log("Success! Created Marketplace, config and user account.");
            }, err => {
                console.log("Error!", err);
            });

            return authCtrl
                .createNewAccount(db.get(tenantId), userData, cb);
        }
    ], cb);
};

module.exports = {
    deployNewMarketplace
};
