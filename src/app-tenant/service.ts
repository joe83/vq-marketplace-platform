const async = require("async");
const tenantDb = require("./models");
const db = require("../app/models/models");
// const workers = require("../app/workers");

import * as randomstring from "randomstring";
import * as authCtrl from "../app/controllers/authCtrl";
import * as tenantModelsProvider from "./tenantModelsProvider";
import { VQ } from "../core/interfaces";

interface Tenant {
  email: string;
  source: string;
  emailVerified?: boolean;
  tenantId?: string;
  status?: 0 | 1 | 2 | 3
}

interface APIError {
  code: string;
  httpCode: 400 | 500;
}

export const createNewTenant = (tenant: Tenant, cb: (err: APIError, tenant?: any) => void) => {
  tenantModelsProvider.getModels((err: any, tenantModels: any) => {
    tenantModels
            .tenant
            .findOrCreate({
                where: {
                    email: tenant.email
                },
                defaults: {
                    status: tenant.status,
                    tenantId: tenant.tenantId,
                    emailVerified: tenant.emailVerified,
                    apiKey: randomstring.generate(32),
                    source: tenant.source
                }
            })
            .spread((tenant: any, isNew: boolean) => {
                if (!isNew) {
                  return cb({ code: "TENANT_EMAIL_TAKEN", httpCode: 400 })
                }
  
                return cb(undefined, tenant);
            }, cb);
    });
};

export const deployNewMarketplace = (tenantId: string, apiKey: string, password: string, repeatPassword: string, marketplaceType: "blank" | String, configOverwrites: { [key: string]: string }, cb: (err: any) => void) => {
  /**
   * Intialize the tentant db first!
   */
  tenantModelsProvider.getModels(() => {
      const tenantModels = tenantDb.get("vq-marketplace");
      let marketplaceModels: any;

      let tenantRef: any;

      const marketplaceCategories = require(`../example-configs/${marketplaceType}/categories.json`);
      const marketplaceConfig = require(`../example-configs/${marketplaceType}/config.json`);

      if (!marketplaceConfig) {
        console.log('Marketplace config for %s was not found in example-configs directory', marketplaceType);
      }

      Object
        .keys(configOverwrites)
        .forEach(configOverwriteKey => {
          marketplaceConfig[configOverwriteKey] = configOverwrites[configOverwriteKey];
        });

        async.waterfall([
          (cb: VQ.StandardCallback) => {
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
                .then((rTenantRef: any) => {
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
          (cb: VQ.StandardCallback) => {
              db.create(tenantId, marketplaceType, err => {
                if (err) {
                  return cb(err);
                }

                // disabled
                // workers.registerWorkers(tenantId);

                tenantRef
                  .update({
                    status: 2
                  })
                  .then(() => cb(), cb);
              });
            },
            (cb: VQ.StandardCallback) => {
              marketplaceModels = db.get(tenantId);

              marketplaceModels
                .appConfig
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
            (cb: VQ.StandardCallback) => {
              marketplaceModels = db.get(tenantId);

              marketplaceModels
                .appTaskCategory
                .bulkCreateOrUpdate(
                  marketplaceCategories,
                  err => {
                    if (err) {
                      return cb(err);
                    }

                    cb();
                  });
            },
            (cb: VQ.StandardCallback) => {
              const userData: VQ.AccountData = {
                email: tenantRef.email,
                firstName: tenantRef.firstName,
                lastName: tenantRef.lastName,
                userType: 0,
                password: password,
                props: {}
              };

              authCtrl.createNewAccount(marketplaceModels, userData, (err: any) => cb(err));
            },
            (cb: VQ.StandardCallback) => {
              tenantRef
                .update({
                  status: 3
                })
                .then(() => {
                console.log("Success! Created Marketplace, initial config and user account.");

                return cb();
              }, cb);
            }
          ], cb);
    });
};
