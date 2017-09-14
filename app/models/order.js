module.exports = (sequelize, DataTypes) => {
  const ORDER_STATUS = {
    PENDING: '0',
    MARKED_DONE: '10',
    SETTLED: '15',
    CANCELED: '25'
  };

  const Order = sequelize.define("order", {
      status: {
        type: DataTypes.ENUM(
          ORDER_STATUS.PENDING,
          ORDER_STATUS.MARKED_DONE,
          ORDER_STATUS.SETTLED,
          ORDER_STATUS.CANCELED
        ),
        default: ORDER_STATUS.PENDING
      },
      amount: {
        type: DataTypes.INTEGER,
        default: 0
      },
      autoSettlementStartedAt: {
        allowNull: true,
        type: DataTypes.DATE
      },
      settledAt: {
        type: DataTypes.DATE
      },
      currency: {
        type: DataTypes.ENUM('PLN', 'HUF', 'EUR'),
        default: 0
      }
  }, {
      tableName: 'order'
  });


  Order.associate = models => {
    Order.belongsTo(models.user);
    Order.belongsTo(models.task);
    Order.belongsTo(models.request);
    Order.belongsTo(models.billingAddress);
    Order.hasOne(models.review);
  };

  Order.ORDER_STATUS = ORDER_STATUS;

  return Order;
};
