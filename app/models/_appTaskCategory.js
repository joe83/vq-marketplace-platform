module.exports = (sequelize, DataTypes) => {
  const appTaskCategory = sequelize.define("appTaskCategory", {
      code: { type: DataTypes.STRING, required: true, unique: true },
      bigImageUrl: { type: DataTypes.STRING },
      imageUrl: { type: DataTypes.STRING },
      label: { type: DataTypes.STRING, required: true },
      minPriceHour: { type: DataTypes.INTEGER, default: 0 },
      desc: { type: DataTypes.STRING }
  }, {
      tableName: '_appTaskCategory',
      classMethods: {
        associate: models => {
            // appTaskCategory.belongsTo(models.appTaskCategory);
        }
      }
  });

  return appTaskCategory;
};
