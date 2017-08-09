const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const config = require("../config/configProvider.js")();

var sequelize = new Sequelize(config.db, {
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
});

var db = {};

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

module.exports = db;
