const async = require("async");
const marketplaceConfig = require("vq-marketplace-config");

const tableName = "_appLabel";

module.exports = (sequelize, DataTypes) => {
  const appLabel = sequelize.define("appLabel", {
      labelKey: { type: DataTypes.STRING, required: true },
      labelValue: { type: DataTypes.STRING },
      lang: {
        type: DataTypes.ENUM("de", "en", "pl", "hu"),
        required: true
      }
  }, {
    createdAt: false,
    updatedAt: false,
    tableName
  });

  // expansion of model
  appLabel.updateFactory = () => (labelKey, labelValue, lang, cb) => { 
      appLabel
      .findOne({
        where: {
          $and: [
            { labelKey },
            { lang }
          ]
        }
      })
      .then(obj => {
        if (!obj) {
          console.log(`Creating label ${labelKey} (lang: ${lang} )`);

          return appLabel
            .create({ labelKey, labelValue, lang })
            .then(() => cb(), cb);
        }

        if (obj.labelValue !== labelValue) {
          console.log(`Updating label ${labelKey} (lang: ${lang})`);

          return obj
            .update({
              labelValue
            })
            .then(() => cb(), cb);
        }

        return cb();
      }, cb);
  };

  appLabel.upsertFactory = () => (labelKey, labelValue, lang, cb) => {
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
                    labelValue,
                    lang
                  })
                  .then(() => cb(), cb);
            }

            console.log(`Label "${labelKey}" already exists.`);

            return cb();
          }, cb);
  };

  appLabel.insertSeed = (usecase, lang, cb) => {
    console.log("[appLabel.insertSeed] Creating seed labels");
    
    const defaultLabels = require("../../example-configs/services/i18n/en.json");
    
    const values = Object
    .keys(defaultLabels)
      .map(labelKey => {
        return "(" + [
          `'${labelKey.toUpperCase()}'`,
          `'${lang}'`,
          defaultLabels[labelKey] ? `'${defaultLabels[labelKey].replace(/'/g,"''")}'` : "NULL"
        ].join(",") + ")";
      })
      .join(",");

    let sql = `INSERT INTO ${tableName} (labelKey, lang, labelValue) VALUES ${values}`;
    
    console.time("labelSeedInsert");
    sequelize.query(sql, { type: sequelize.QueryTypes.INSERT })
      .then(() => cb(), cb)
      .finally(() => {
        console.timeEnd("labelSeedInsert");
      });
  };

  appLabel.bulkCreateOrUpdate = (labels, forceUpdate, cb) => {
      const upsert = forceUpdate ? appLabel.updateFactory() : appLabel.upsertFactory();
      // const upsert = appLabel.upsertFactory();

      async.eachSeries(labels, (label, cb) =>
        upsert(
          label.labelKey,
          label.labelValue,
          label.lang,
          cb
        )
      , cb);
  };

  // init of the table / ensuring default labels exist
  appLabel.addDefaultLangLabels = (lang, usecase, force, cb) => {
      console.log("Creating default labels");
    
      const defaultLabels = require("../../example-configs/services/i18n/en.json");
      
      const batchLabels = Object.keys(defaultLabels)
        .map(labelKey => {
          return {
            labelKey: labelKey.toUpperCase(),
            labelValue: defaultLabels[labelKey],
            lang
          };
        });

      return appLabel.bulkCreateOrUpdate(batchLabels, force, cb);
  };

  return appLabel;
};
