/**
 * Customizing model for application labels (i18n)
 */
const marketplaceConfig = require('vq-marketplace-config');

module.exports = (sequelize, DataTypes) => {
  const appUserProperty = sequelize.define("appUserProperty", {
      propKey: { type: DataTypes.STRING, required: true, unique: true },
      labelKey: { type: DataTypes.STRING, required: true },
      required: { type: DataTypes.BOOLEAN, default: false },
  }, {
      tableName: '_appUserProperty',
      classMethods: {
        associate: models => {
          // models.hasOne(models.app);
        }
      }
  });

  // expansion of model
  appUserProperty.updateFactory = () => (propKey, labelKey, required) => appUserProperty
        .findOne({ where: { $and: [ { propKey } ] }})
        .then(obj => {
            if (!obj) {
                return appUserProperty.create({ propKey, labelKey, required });
            }

            appUserProperty.update({
              required,
              labelKey
            }, {
                where: { 
                    id: obj.id
                }
            });
        });

  appUserProperty.bulkCreateOrUpdate = (userProperties, forceUpdate) => new Promise(resolve => {
      const upsert = appUserProperty.updateFactory();
      
      userProperties
      .forEach(userProperty => {
        upsert(userProperty.propKey, userProperty.labelKey, userProperty.required);
      });
  
      return resolve();
  });

  // init of the table / ensuring default labels exist
  appUserProperty.addDefaultUserProperties = force => {
    const userProperties = marketplaceConfig.userProperties();

    const batchData = Object.keys(userProperties)
      .map(propKey => {
        return {
          propKey,
          labelKey: userProperties[propKey].labelKey,
          required: userProperties[propKey].required
        };
      });

    appUserProperty.bulkCreateOrUpdate(batchData, force);
  };

  return appUserProperty;
};
