const async = require("async");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");
const Sequelize = require("sequelize");
const config = require("../config/configProvider.js")();

const tenantConnections = {};

const create = (tenantId, cb) => {
  if (tenantConnections[tenantId]) {
    throw new Error(`Tenant ${tenantId} already initialised!`);
  }

  var isNewDatabase = false;

  async.waterfall([
    cb => {
      const connection = mysql.createConnection({
        host: config.VQ_DB_HOST,
        user: config.VQ_DB_USER,
        password: config.VQ_DB_PASSWORD
      });

      connection.query(
        'CREATE DATABASE ??;',
        [ tenantId ],
        (err, results, fields) => {
          if (err) {
            if (err.code === 'ER_DB_CREATE_EXISTS') {
              return cb();
            }

            return cb(err);
          }

          isNewDatabase = true;

          cb();
        }
      );
    },
    cb => {
      const db = {};
      const sequelize = new Sequelize(tenantId, config.VQ_DB_USER, config.VQ_DB_PASSWORD, {
        host: config.VQ_DB_HOST,
        logging: false,
        dialect: 'mysql',
        pool: {
          max: 5,
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
      
      db.seq = sequelize;
      db.Sequelize = Sequelize;
    
      tenantConnections[tenantId] = db;

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

      console.log('INITIALIZING...');

      const marketplaceType = 'services';
      const models = tenantConnections[tenantId];

      models.appConfig.addDefaultConfig(marketplaceType, true);

      models.appLabel.addDefaultLangLabels('en', marketplaceType, true)
      .then(_ => _, _ => _);
      

      models.post.addDefaultPosts(marketplaceType, true);

      models.appUserProperty.addDefaultUserProperties(marketplaceType, true);

      cb();
    }
  ], cb);
};

const get = tenantId => {
  if (tenantConnections[tenantId]) {
    return tenantConnections[tenantId];
  }

  throw new Error(`Tenant ${tenantId} does not exists`);
};

module.exports = {
  create,
  get
};
