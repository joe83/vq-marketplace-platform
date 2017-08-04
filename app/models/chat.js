module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define("message", {
      fromUserId: { type: DataTypes.INTEGER, allowNull: false },
      toUserId: { type: DataTypes.INTEGER, allowNull: false },
      message: {
        type: DataTypes.STRING, allowNull: false
      }
  }, {
      tableName: 'message',
      classMethods: {
        associate: models => {
          Message.belongsTo(models.request);
          Message.belongsTo(models.task);
        }
      }
  });

  return Message;
};