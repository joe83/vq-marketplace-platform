module.exports = (sequelize, DataTypes) => {
  const appTaskCategory = sequelize.define("appTaskCategory", {
      code: { type: DataTypes.STRING, required: true, unique: true },
      bigImageUrl: { type: DataTypes.STRING },
      imageUrl: { type: DataTypes.STRING },
      label: { type: DataTypes.STRING, required: true },
      desc: { type: DataTypes.STRING, defaultValue: "" },
      minPriceHour: { type: DataTypes.INTEGER, defaultValue: 0 },
      minQuantity: { type: DataTypes.FLOAT },
      maxQuantity: { type: DataTypes.FLOAT },
      quantityStep: { type: DataTypes.FLOAT },
      unitOfMeasure: { type: DataTypes.STRING(10) }
  }, {
      tableName: "_appTaskCategory"
  });

  return appTaskCategory;
};

