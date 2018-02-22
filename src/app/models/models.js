const async = require("async");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");
const Sequelize = require("sequelize");

const tenantRegister = {};
const tenantConnections = {};

const getTenantIds = () => Object.keys(tenantConnections);

const pool = mysql.createPool({
  connectionLimit: 2,
  host: process.env.VQ_DB_HOST,
  user: process.env.VQ_DB_USER,
  password: process.env.VQ_DB_PASSWORD
});

const createSeqConnection = (tenantId) => {
  const db = {};
      const sequelize = new Sequelize(tenantId, process.env.VQ_DB_USER, process.env.VQ_DB_PASSWORD, {
        host: process.env.VQ_DB_HOST,
        logging: false,
        dialect: "mysql",
        pool: {
          max: 1,
          min: 0,
          idle: 10000
        }
      });

      fs.readdirSync(__dirname)
          .filter(file => {
              return (file.indexOf(".") !== 0) && (file !== "models.js");
          })
          .forEach(file => {
              var model = sequelize.import(path.join(__dirname, file));
              db[model.name] = model;
          });
      
      Object.keys(db).forEach(modelName => {
        if ("associate" in db[modelName]) {
          db[modelName].associate(db);
        }
      });

      db.tenantId = tenantId;
      db.seq = sequelize;
      db.Sequelize = Sequelize;

      return db;
};

const refreshTenantRegister = tenantId => {
  tenantRegister[tenantId] = {
    established: Date.now() / 1000
  };
};

const create = (tenantId, marketplaceType, cb) => {
  console.log(`[models] Creating tenant model: ${tenantId}`);

  if (tenantConnections[tenantId]) {
    return cb({
      httpCode: 400,
      code: "TENANT_ALREADY_DEPLOYED"
    });
  }

  var isNewDatabase = false;

  async.waterfall([
    cb => pool.query(
      "CREATE DATABASE ?? CHARACTER SET utf8 COLLATE utf8_general_ci;",
      [ tenantId ],
      (err) => {
        if (err) {
          if (err.code === "ER_DB_CREATE_EXISTS") {
            return cb();
          }

          return cb(err);
        }

        isNewDatabase = true;

        cb();
      }
    ),
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

const get = tenantId => {
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

module.exports = {
  tenantRegister,
  tenantConnections,
  refreshTenantRegister,
  create,
  get,
  getTenantIds
};
