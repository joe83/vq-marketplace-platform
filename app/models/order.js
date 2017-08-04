module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define("order", {
      status: {
        type: DataTypes.INTEGER,
        default: 0
      },
      amount: {
        type: DataTypes.INTEGER,
        default: 0
      },
      currency: {
        type: DataTypes.ENUM('PLN', 'HUF', 'EUR'),
        default: 0
      }
  }, {
      tableName: 'order',
      classMethods: {
        associate: models => {
          Order.belongsTo(models.user)
          Order.belongsTo(models.task)
          Order.belongsTo(models.request);
          Order.belongsTo(models.billingAddress);
        }
      }
  });

  return Order;
};
