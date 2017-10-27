/**
 * Customizing model for application definition and meta data like corporate identity, logos, pricing levels etc etc.
 */
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
  AppConfig.updateFactory = () => (fieldKey, fieldValue) => AppConfig
        .findOne({ where: { fieldKey }})
        .then(obj => {
          if (!obj) {
            return AppConfig
              .create({ fieldKey, fieldValue });
          }

          obj.fieldValue !== fieldValue && AppConfig.update({ fieldValue }, { where: { id: obj.id } });
        });

  AppConfig.upsertFactory = () => (fieldKey, fieldValue, lang) => AppConfig
        .findOne({ where: { fieldKey }})
        .then(obj => !obj && AppConfig.create({ fieldKey, fieldValue, lang }));

  AppConfig.bulkCreateOrUpdate = (configs, forceUpdate) => new Promise(resolve => {
      const upsert = forceUpdate ? AppConfig.updateFactory() : AppConfig.upsertFactory();
      
      configs.forEach(config => {
        if (!config.fieldKey) {
          return;
        }

        upsert(config.fieldKey.toUpperCase(), config.fieldValue);
      });
  
      return resolve();
  });

  const addDefaultConfig = (usecase) => {
    const defaultConfigs = marketplaceConfig[usecase].config();
    const dataProcessed = Object.keys(defaultConfigs)
      .map(fieldKey => {
        return {
          fieldKey,
          fieldValue: defaultConfigs[fieldKey]
        };
      });

    AppConfig.bulkCreateOrUpdate(dataProcessed, true);
  };

  AppConfig.addDefaultConfig = addDefaultConfig;

  return AppConfig;
};