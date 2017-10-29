module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("tenant", {
        tenantId: { type: DataTypes.STRING, required: true, unique: true },
        email: { type: DataTypes.STRING, required: true },
        firstName: { type: DataTypes.STRING, required: true },
        lastName: { type: DataTypes.STRING, required: true },
        marketplaceName: { type: DataTypes.STRING, required: true },
        marketplaceType: { type: DataTypes.STRING, required: true },
        country: { type: DataTypes.STRING, required: true }
  }, {
    tableName: 'tenant'
  });

  Model.associate = models => {};

  return Model;
};