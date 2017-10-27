module.exports = (sequelize, DataTypes) => {
    const Model = sequelize.define("userResetCode", {
        code: { type: DataTypes.STRING, required: true }
    }, {
      tableName: 'userResetCode'
    });
  
    Model.associate = models => {
        Model.belongsTo(models.userAuth, { as: 'user' });
    };

    return Model;
  };
  