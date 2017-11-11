const marketplaceConfig = require("vq-marketplace-config");

const tableName = "_appUserProperty";

module.exports = (sequelize, DataTypes) => {
  const appUserProperty = sequelize.define("appUserProperty", {
      propKey: { type: DataTypes.STRING, required: true, unique: true },
      labelKey: { type: DataTypes.STRING, required: true },
      required: { type: DataTypes.BOOLEAN, default: false },
  }, {
      tableName,
      createdAt: false,
      updatedAt: false
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
  appUserProperty.addDefaultUserProperties = (marketplaceType, force) => {
    const userProperties = marketplaceConfig[marketplaceType].userProperties();

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

  appUserProperty.insertSeed = (marketplaceType, cb) => {
    const userProperties = marketplaceConfig[marketplaceType].userProperties();

    const values = Object.keys(userProperties)
    .map(propKey => {
      return "(" + [
        `'${propKey}'`,
        `'${userProperties[propKey].labelKey}'`,
        userProperties[propKey].required
      ].join(",") + ")";
    })
    .join(",");

  let sql = `INSERT INTO ${tableName} (propKey, labelKey, required) VALUES ${values}`;
  
  console.time("userPropertySeedInsert");
  sequelize.query(sql, { type: sequelize.QueryTypes.INSERT })
    .then(() => cb(), cb)
    .finally(() => {
      console.timeEnd("userPropertySeedInsert");
    });
  };

  return appUserProperty;
};
