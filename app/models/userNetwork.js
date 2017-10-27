module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("userNetwork", {
      networkId: { type: DataTypes.STRING, required: true },
      network: { type: DataTypes.STRING, required: true },
      token: { type: DataTypes.STRING, required: true },
      refreshToken: { type: DataTypes.STRING }
  }, {
    tableName: 'auth_userNetwork'
  });

  Model.associate = models => {
    Model.belongsTo(models.userAuth, { as: 'user' });
};

  return Model;
};