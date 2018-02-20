/**
 * Customizing model for application definition and meta data like corporate identity, logos, pricing levels etc etc.
 */
const async = require("async");
const tableName = "_appConfig";

module.exports = (sequelize, DataTypes) => {
  const AppConfig = sequelize.define("appConfig", {
      fieldKey: {
        type: DataTypes.STRING,
        required: true,
        unique: true
      },
      // secret: { type: DataType.Boolean },
      fieldValue: { type: DataTypes.STRING }
  }, {
      tableName,
      createdAt: false,
      updatedAt: false
  });

  // expansion of model
  AppConfig.updateFactory = () => (fieldKey, fieldValue, cb) => AppConfig
        .findOne({
          where: {
            fieldKey
          }
        })
        .then(obj => {
          if (!obj) {
            console.log(`Adding config: ${fieldKey}`);
            
            return AppConfig
              .create({
                fieldKey,
                fieldValue
              })
              .then(() => cb(), cb);
          }

          if (obj.fieldValue !== fieldValue) {
            console.log(`Updating CONFIG: ${fieldKey}`);
            
            return obj
              .update({ fieldValue })
              .then(() => cb(), cb);
          }

          return cb();
        }, cb);

  AppConfig.upsertFactory = () => (fieldKey, fieldValue, cb) => {
      AppConfig
      .findOne({
        where: { fieldKey }
      })
      .then(obj => {
        if (!obj) {
          return AppConfig
          .create({
            fieldKey,
            fieldValue
          })
          .then(() => {
            return cb();
          }, cb);
        }

        return cb();
      }, cb);
  };

  AppConfig.bulkCreateOrUpdate = (configs, forceUpdate, cb) => {
    const upsert = forceUpdate ? AppConfig.updateFactory() : AppConfig.upsertFactory();
    
    const updateConfigs = configs
      .filter(_ => _.fieldKey)
      .map(_ => {
        _.fieldKey = _.fieldKey.toUpperCase();

        return _;
      });

    async
    .eachSeries(updateConfigs, (config, cb2) =>
      upsert(config.fieldKey, config.fieldValue, cb2)
    ,cb);
  };

  const addDefaultConfig = (usecase, cb) => {
    console.log("Creating default config");
    
    const defaultConfigs = require(`../../example-configs/${usecase}/config.json`);
    const dataProcessed = Object.keys(defaultConfigs)
      .map(fieldKey => {
        return {
          fieldKey,
          fieldValue: defaultConfigs[fieldKey]
        };
      });

    AppConfig.bulkCreateOrUpdate(dataProcessed, false, cb);
  };

  AppConfig.insertSeed = (usecase, cb) => {
    console.log("[appConfig.insertSeed] Creating seed configs");

    const defaultConfigs = require(`../../example-configs/${usecase}/config.json`);
    
    const values = Object.keys(defaultConfigs)
      .map(fieldKey => {
        return "(" + [
          `'${fieldKey.toUpperCase()}'`,
          defaultConfigs[fieldKey] ? `'${String(defaultConfigs[fieldKey]).replace(/'/g,"''")}'` : "NULL"
        ].join(",") + ")";
      })
      .join(",");

    let sql = `INSERT INTO ${tableName} (fieldKey, fieldValue) VALUES ${values}`;
    
    console.time("configSeedInsert");
    sequelize.query(sql, { type: sequelize.QueryTypes.INSERT })
      .then(() => cb(), cb)
      .finally(() => {
        console.timeEnd("configSeedInsert");
      });
  };

  AppConfig.addDefaultConfig = addDefaultConfig;

  return AppConfig;
};