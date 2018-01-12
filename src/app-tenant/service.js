const async = require("async");
const tenantDb = require("./models");
const db = require("../app/models/models");
const workers = require("../app/workers");
const authCtrl = require("../app/controllers/authCtrl");

const deployNewMarketplace = (tenantId, apiKey, password, repeatPassword, marketplaceType, configOverwrites, cb) => {
  const tenantModels = tenantDb.get("vq-marketplace");
  let marketplaceModels;

  let tenantRef;

  import(`../example-configs/${marketplaceType}/config.json`)
    .then(marketplaceConfig => {
      marketplaceConfig = {...marketplaceConfig, ...configOverwrites};

      async.waterfall([
        cb => {
          tenantModels
            .tenant
            .findOne({
              where: {
                $and: [
                  {tenantId},
                  {apiKey}
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
          db.create(tenantId, marketplaceType, err => {
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
          marketplaceModels = db.get(tenantId);
          console.log(marketplaceModels);

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
    })
    .catch(err => {
      if (err) {
        console.log('Marketplace config for %s was not found in example-configs directory', marketplaceType);
      }
    });


};

module.exports = {
  deployNewMarketplace
};
