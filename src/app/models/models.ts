import * as async from "async";
import * as Sequelize from "sequelize";

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");

require('dotenv').config();

interface IVQTenant {}

export const tenantRegister: { [tenantId: string]: IVQTenant } = {};

export const tenantConnections: { [tenantId: string]: any } = {};

export const getTenantIds = () => Object.keys(tenantConnections);

const createSeqConnection = (tenantId: string) => {
  const db: { [tenantId: string]: any } = {};

  const sequelize = new Sequelize(tenantId, process.env.VQ_DB_USER, process.env.VQ_DB_PASSWORD, {
    dialect: "mysql",
    host: process.env.VQ_DB_HOST,
    logging: false,
    pool: {
      idle: 10000,
      max: 1,
      min: 0
    }
  });

  fs.readdirSync(__dirname)
      .filter((file: string) => {
          return (file.indexOf(".") !== 0) && (file !== "models.js");
      })
      .forEach((file: string) => {
          const model = sequelize.import(path.join(__dirname, file));

          db[model.name] = model;
      });

  Object.keys(db)
  .forEach((modelName: string) => {
    if ("associate" in db[modelName]) {
      db[modelName].associate(db);
    }
  });

  db.tenantId = tenantId;
  db.seq = sequelize;
  db.Sequelize = Sequelize;

  return db;
};

export const refreshTenantRegister = tenantId => {
  tenantRegister[tenantId] = {
    established: Date.now() / 1000
  };
};

export const create = (tenantId: string, marketplaceType: "services" | "blank", cb) => {
  console.log(`[models] Creating tenant model: ${tenantId}`);

  if (tenantConnections[tenantId]) {
    return cb({
      code: "TENANT_ALREADY_DEPLOYED",
      httpCode: 400
    });
  }

  let isNewDatabase = false;

  async.waterfall([
      cb => {
        const connection = mysql.createConnection({
          host: process.env.VQ_DB_HOST,
          password: process.env.VQ_DB_PASSWORD,
          user: process.env.VQ_DB_USER
        });

        connection.connect();

        connection.query(
          "CREATE DATABASE ?? CHARACTER SET utf8 COLLATE utf8_general_ci;",
          [ tenantId ],
          (err: { code: string }) => {
            if (err) {
              if (err.code === "ER_DB_CREATE_EXISTS") {
                return cb();
              }

              return cb(err);
            }

            isNewDatabase = true;

            cb();
          }
        );

        connection.end();
    },
    cb => {
      tenantConnections[tenantId] = createSeqConnection(tenantId);

      refreshTenantRegister(tenantId);

      cb();
    },
    cb => {
      const models = tenantConnections[tenantId];

      models.seq.sync().then(() => {
        cb();
      }, cb);
    },
    cb => {
      if (!isNewDatabase) {
        return cb();
      }

      console.log("INITIALIZING...");

      const models = tenantConnections[tenantId];

      async.waterfall([
        cb => {
          models.appConfig.insertSeed(marketplaceType, err => {
            if (err) {
              console.error(err);
            }

            cb();
          });
        },
        cb => {
          models.appLabel.insertSeed(marketplaceType, "en", err => {
            if (err) {
              console.error(err);
            }

            cb();
          });
        },
        cb => {
          models.post.insertSeed(marketplaceType, err => {
            if (err) {
              console.error(err);
            }

            cb();
          });
        }, 
        cb => {
          models.appUserProperty.insertSeed(marketplaceType, err => {
            if (err) {
              console.error(err);
            }

            cb();
          });
        }, 
      ], (err) => {
        // we delete the object not to waste the sql connection
        tenantConnections[tenantId].seq.close();

        delete tenantConnections[tenantId];
        console.log(`Completed for ${tenantId}`);

        cb(err);
      });
    }], cb);
};

export const get = (tenantId: string) => {
  if (!tenantRegister[tenantId]) {
    return undefined;
  }

  refreshTenantRegister(tenantId);

  if (tenantConnections[tenantId]) {
    return tenantConnections[tenantId];
  }

  tenantConnections[tenantId] = createSeqConnection(tenantId);

  return tenantConnections[tenantId];
};
