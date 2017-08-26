const async = require('async');
/**
 * Customizing model for application labels (i18n)
 */
const marketplaceConfig = require('vq-marketplace-config');

console.log(marketplaceConfig);

module.exports = (sequelize, DataTypes) => {
  const appLabel = sequelize.define("appLabel", {
      labelGroup: { type: DataTypes.STRING },
      labelKey: { type: DataTypes.STRING, required: true },
      labelValue: { type: DataTypes.STRING },
      lang: {
        type: DataTypes.ENUM('de', 'en', 'pl', 'hu'),
        required: true
      }
  }, {
      tableName: '_appLabel',
      classMethods: {
        associate: models => {
          // models.hasOne(models.app);
        }
      }
  });

  // expansion of model
  appLabel.updateFactory = () => (labelKey, labelGroup, labelValue, lang) =>
        new Promise((resolve, reject) => {
          appLabel
          .findOne({ where: { $and: [ { labelKey }, { lang } ] }})
          .then(obj => {
            if (!obj) {
              return appLabel
                .create({ labelKey, labelGroup, labelValue, lang })
                .then(resolve, reject)
            }

            if (obj.labelValue !== labelValue) {
              return appLabel
              .update({ labelGroup, labelValue, lang }, { where: { id: obj.id } })
              .then(resolve, reject);
            }

            return resolve();
          });
      });

  appLabel.upsertFactory = () => (labelKey, labelGroup, labelValue, lang) =>
        new Promise((resolve, reject) => {
          appLabel
          .findOne({ where: { $and: [ { labelKey }, { lang } ] }})
          .then(obj => {
            !obj &&
            appLabel
            .create({ labelKey, labelGroup, labelValue, lang })
            .then(resolve, reject)
          }, reject);
        });
        

  appLabel.bulkCreateOrUpdate = (labels, forceUpdate) => new Promise(resolve => {
      const upsert = forceUpdate ? appLabel.updateFactory() : appLabel.upsertFactory();
      
      async.eachLimit(labels, 5, (label, cb) => {
        if (!label.labelKey) {
          return;
        }

        var labelGroup =  label.labelGroup ? label.labelGroup.toUpperCase() : null;

        upsert(
          label.labelKey.toUpperCase(),
          labelGroup,
          label.labelValue,
          label.lang
        )
        .then(() => cb(), cb);

      }, resolve);
  });

  // init of the table / ensuring default labels exist
  appLabel.addDefaultLangLabels = (lang, force) => {
      const defaultLabels = marketplaceConfig.i18n(lang);
      const labelGroups = marketplaceConfig.labelGroups();
      
      const batchLabels = Object.keys(defaultLabels)
        .map(labelKey => {
          return {
            labelKey,
            labelGroup: labelGroups[labelKey],
            labelValue: defaultLabels[labelKey],
            lang
          };
        });

      return appLabel.bulkCreateOrUpdate(batchLabels, force);
  };

  return appLabel;
};
