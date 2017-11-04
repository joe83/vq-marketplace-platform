module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define("message", {
      message: {
        type: DataTypes.STRING, allowNull: false
      }
  }, {
      tableName: "message"
  });

  Message.associate = models => {
    Message.belongsTo(models.request);
    Message.belongsTo(models.task);
    Message.belongsTo(models.user, { as: "fromUser" });
    Message.belongsTo(models.user, { as: "toUser" });
  };

  return Message;
};