module.exports = (sequelize, DataTypes) => {
    const Model = sequelize.define("userResetCode", {
        code: { type: DataTypes.STRING, required: true }
    }, {
      tableName: "auth_userResetCode"
    });
  
    Model.associate = models => {
        Model.belongsTo(models.userAuth, { as: "user" });
    };

    return Model;
  };
  