module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("tenant", {
        tenantId: { type: DataTypes.STRING, required: true, unique: true },
        email: { type: DataTypes.STRING, required: true, unique: true },
        emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
        apiKey: { type: DataTypes.STRING, required: true },
        firstName: { type: DataTypes.STRING, required: true },
        lastName: { type: DataTypes.STRING, required: true },
        marketplaceName: { type: DataTypes.STRING, required: true },
        marketplaceType: { type: DataTypes.ENUM("services", "rentals"), required: true, defaultValue: "services" },
        country: { type: DataTypes.STRING, required: true },
        status: { type: DataTypes.INTEGER(1), required: true, defaultValue: 0 },
        stripeAccountId: { type: DataTypes.STRING, required: false },
        stripeAccount: { type: DataTypes.JSON, required: false }
  }, {
    tableName: "tenant"
  });

  return Model;
};