module.exports = (sequelize, DataTypes) => {
  const appTaskCategory = sequelize.define("appTaskCategory", {
      code: { type: DataTypes.STRING, required: true, unique: true },
      bigImageUrl: { type: DataTypes.STRING },
      imageUrl: { type: DataTypes.STRING },
      label: { type: DataTypes.STRING, required: true },
      desc: { type: DataTypes.STRING },
      minPriceHour: { type: DataTypes.INTEGER, default: 0 },
      minQuantity: { type: DataTypes.INTEGER },
      maxQuantity: { type: DataTypes.INTEGER },
      quantityStep: { type: DataTypes.INTEGER },
      unitOfMeasure: { type: DataTypes.STRING(10) }
  }, {
      tableName: "_appTaskCategory"
  });

  return appTaskCategory;
};
