const async = require('async');
const marketplaceConfig = require('vq-marketplace-config');

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
        }
      }
  });

  // expansion of model
  appLabel.updateFactory = () => (labelKey, labelGroup, labelValue, lang, cb) => { 
      appLabel
      .findOne({ where: { $and: [ { labelKey }, { lang } ] }})
      .then(obj => {
        if (!obj) {
          console.log(`Creating ${lang} label ${labelGroup}->${labelKey}`);

          return appLabel
            .create({ labelKey, labelGroup, labelValue, lang })
            .then(() => cb(), cb)
        }

        if (obj.labelValue !== labelValue) {
          return appLabel
            .update({ labelGroup, labelValue, lang }, { where: { id: obj.id } })
            .then(() => cb(), cb);
        }

        return cb();
      }, cb);
  };

  appLabel.upsertFactory = () => (labelKey, labelGroup, labelValue, lang, cb) => {
          appLabel
          .findOne({ 
            where: {
              $and: [
                { labelKey },
                { lang }
              ]
            }
          }).then(obj => {
            if (!obj) {
                console.log(`Creating label "${labelKey}"`);
                
                return appLabel
                  .create({
                    labelKey,
                    labelGroup,
                    labelValue,
                    lang
                  })
                  .then(() => cb(), cb);
            }

            console.log(`Label "${labelKey}" already exists.`);

            if (obj.labelGroup !== labelGroup) {
              console.log(`Group of the label "${labelKey}" differs! Should be ${labelGroup}`);

              return obj
                .update({
                  labelGroup
                })
                .then(() => cb(), cb);
            }

            return cb();
          }, cb);
  };
        
  appLabel.bulkCreateOrUpdate = (labels, forceUpdate, cb) => {
      const upsert = forceUpdate ? appLabel.updateFactory() : appLabel.upsertFactory();
      // const upsert = appLabel.upsertFactory();

      async.eachSeries(labels, (label, cb) => upsert(
        label.labelKey,
        label.labelGroup,
        label.labelValue,
        label.lang,
        cb
      ), cb);
  };

  // init of the table / ensuring default labels exist
  appLabel.addDefaultLangLabels = (lang, usecase, force, cb) => {
      console.log("Creating default labels");
    
      const defaultLabels = marketplaceConfig[usecase].i18n(lang);
      const labelGroups = marketplaceConfig[usecase].labelGroups();
      
      const batchLabels = Object.keys(defaultLabels)
        .map(labelKey => {
          return {
            labelKey: labelKey.toUpperCase(),
            labelGroup: labelGroups[labelKey] ? labelGroups[labelKey].toUpperCase() : null,
            labelValue: defaultLabels[labelKey],
            lang
          };
        });

      return appLabel.bulkCreateOrUpdate(batchLabels, force, cb);
  };

  return appLabel;
};
