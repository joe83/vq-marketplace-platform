const async = require("async");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");
const Sequelize = require("sequelize");
const config = require("../../app/config/configProvider.js")();

const tenantConnections = {};

const create = (tenantId, cb) => {
  if (tenantConnections[tenantId]) {
    throw new Error(`Tenant ${tenantId} already initialised!`);
  }

  console.log(`Creating ${tenantId}`);

  async.waterfall([
    cb => {
      const connection = mysql.createConnection({
        host: config[config.env]["VQ_MARKETPLACE_API"]["DB"]["HOST"],
        user: config[config.env]["VQ_MARKETPLACE_API"]["DB"]["USER"],
        password: config[config.env]["VQ_MARKETPLACE_API"]["DB"]["PASSWORD"]
      });

      connection.connect();

      connection.query(
        "CREATE DATABASE ?? CHARACTER SET utf8 COLLATE utf8_general_ci;",
        [ tenantId ],
        (err) => {
          if (err) {
            if (err.code === "ER_DB_CREATE_EXISTS") {
              return cb();
            }

            return cb(err);
          }

          cb();
        }
      );

      connection.end();
    },
    cb => {
      const db = {};
      const sequelize = new Sequelize(tenantId,
        config[config.env]["VQ_MARKETPLACE_API"]["DB"]["USER"],
        config[config.env]["VQ_MARKETPLACE_API"]["DB"]["PASSWORD"],
        {
        host: config[config.env]["VQ_MARKETPLACE_API"]["DB"]["HOST"],
        logging: false,
        dialect: "mysql",
        pool: {
          max: 5,
          min: 0,
          idle: 10000
        }
      });
      
      fs.readdirSync(__dirname)
          .filter(file => {
              return (file.indexOf(".") !== 0) && (file !== "index.js");
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

      models
      .seq
      .sync()
      .then(() => {
        cb(undefined, models);
      }, cb);
    },
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
