module.exports = (sequelize, DataTypes) => {

    const CATEGORY_STATUS = {
        ACTIVE: "0",
        INACTIVE: "103",
        DELETED: "99"
    };
  const appTaskCategory = sequelize.define("appTaskCategory", {
      code: { type: DataTypes.STRING, required: true, unique: true },
      status: {
        type: DataTypes.ENUM(
            CATEGORY_STATUS.ACTIVE,
            CATEGORY_STATUS.INACTIVE,
            CATEGORY_STATUS.DELETED
          ),
          defaultValue: CATEGORY_STATUS.ACTIVE
      },
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

  return appTaskCategory;
};
