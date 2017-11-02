const async = require("async");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");
const Sequelize = require("sequelize");
const config = require("../config/configProvider.js")();

const tenantConnections = {};

const getTenantIds = () => Object.keys(tenantConnections);

const create = (tenantId, cb) => {
  console.log(`[models] Creating tenant model: ${tenantId}`);

  if (tenantConnections[tenantId]) {
    return cb({
      httpCode: 400,
      code: 'TENANT_ALREADY_DEPLOYED'
    });
  }

  var isNewDatabase = false;

  async.waterfall([
    cb => {
      const connection = mysql.createConnection({
        host: config.VQ_DB_HOST,
        user: config.VQ_DB_USER,
        password: config.VQ_DB_PASSWORD
      });

      connection.connect();

      connection.query(
        'CREATE DATABASE ?? CHARACTER SET utf8 COLLATE utf8_general_ci;;',
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

      connection.end();
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
      
      db.tenantId = tenantId;
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
  return tenantConnections[tenantId];
};

module.exports = {
  create,
  get,
  getTenantIds
};
