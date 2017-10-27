module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("userPassword", {
      password: { type: DataTypes.STRING, required: true }
  }, {
    tableName: 'auth_userPassword'
  });

  Model.associate = models => {
    Model.belongsTo(models.userAuth, { as: 'user' });
  };

  return Model;
};
