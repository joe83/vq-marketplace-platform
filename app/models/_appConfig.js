/**
 * Customizing model for application definition and meta data like corporate identity, logos, pricing levels etc etc.
 */
const async = require('async');
const marketplaceConfig = require('vq-marketplace-config');

module.exports = (sequelize, DataTypes) => {
  const AppConfig = sequelize.define("appConfig", {
      fieldKey: { type: DataTypes.STRING },
      fieldValue: { type: DataTypes.STRING }
  }, {
      tableName: '_appConfig',
      classMethods: {
        associate: models => {
        }
      }
  });

  // expansion of model
  AppConfig.updateFactory = () => (fieldKey, fieldValue, lang, cb) => AppConfig
        .findOne({ where: { fieldKey }})
        .then(obj => {
          if (!obj) {
            console.log(`Adding CONFIG: ${fieldKey}`);
            
            return AppConfig
              .create({ fieldKey, fieldValue })
              .then(() => cb(), cb);
          }

          if (obj.fieldValue !== fieldValue) {
            console.log(`Updating CONFIG: ${fieldKey}`);
            
            return AppConfig
              .update({ fieldValue }, { where: { id: obj.id } })
              .then(() => cb(), cb);
          }

          return cb();
        }, cb);

  AppConfig.upsertFactory = () => (fieldKey, fieldValue, lang, cb) => AppConfig
        .findOne({ where: { fieldKey }})
        .then(obj => {
          if (!obj) {
            return AppConfig
            .create({ fieldKey, fieldValue, lang })
            .then(() => cb(), cb);
          }

          return cb();
        });

  AppConfig.bulkCreateOrUpdate = (configs, forceUpdate, cb) => {
    const upsert = forceUpdate ? AppConfig.updateFactory() : AppConfig.upsertFactory();
    
    async
    .eachSeries(configs, (config, cb) => {
      upsert(config.fieldKey.toUpperCase(), config.fieldValue, null, cb);
    }, cb);
  };

  const addDefaultConfig = (usecase, cb) => {
    console.log("Creating default config");
    
    const defaultConfigs = marketplaceConfig[usecase].config();
    const dataProcessed = Object.keys(defaultConfigs)
      .map(fieldKey => {
        return {
          fieldKey,
          fieldValue: defaultConfigs[fieldKey]
        };
      });

    AppConfig.bulkCreateOrUpdate(dataProcessed, false, cb);
  };

  AppConfig.addDefaultConfig = addDefaultConfig;

  return AppConfig;
};