const async = require("async");

module.exports = (sequelize, DataTypes) => {
  const appTaskCategory = sequelize.define("appTaskCategory", {
      code: { type: DataTypes.STRING, required: true, unique: true },
      bigImageUrl: { type: DataTypes.STRING },
      imageUrl: { type: DataTypes.STRING },
      label: { type: DataTypes.STRING, required: true },
      minPriceHour: { type: DataTypes.INTEGER, default: 0 },
      desc: { type: DataTypes.STRING, defaultValue: "" },
      minQuantity: { type: DataTypes.FLOAT },
      maxQuantity: { type: DataTypes.FLOAT },
      quantityStep: { type: DataTypes.FLOAT },
      unitOfMeasure: { type: DataTypes.STRING(10) }
  }, {
      tableName: "_appTaskCategory"
  });

    appTaskCategory.upsertFactory = () => (code, categoryData, cb) => {
        appTaskCategory
        .findOne({
            where: {
                code
            }
        })
        .then(obj => {
            if (!obj) {
            return appTaskCategory
                .create(categoryData)
                .then(() => {
                    return cb();
                }, cb);
            }

            return cb();
        }, cb);
    };

    appTaskCategory.bulkCreateOrUpdate = (configs, cb) => {
        const upsert = appTaskCategory.upsertFactory();

        async
        .eachSeries(configs, (config, cb) => upsert(config.code, config, cb), (err) => cb(err));
    };

    return appTaskCategory;
};