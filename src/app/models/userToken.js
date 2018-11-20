module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("userToken", {
        token: { type: DataTypes.STRING, required: true }
  }, {
    tableName: "auth_userToken"
  });

  Model.associate = models => {
    Model.belongsTo(models.userAuth, { as: "user" });
  };

  return Model;
};