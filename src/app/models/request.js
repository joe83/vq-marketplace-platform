module.exports = (sequelize, DataTypes) => {
  const REQUEST_STATUS = {
    PENDING: "0",
    ACCEPTED: "5",
    BOOKED: "6",
    MARKED_DONE: "10",
    CLOSED: "14",
    SETTLED: "15",
    DECLINED: "20",
    CANCELED: "25"
  };

  const Request = sequelize.define("request", {
      intervalStart: {
        type: DataTypes.INTEGER,
      },
      intervalEnd: {
        type: DataTypes.INTEGER,
      },
      quantity: {
        type: DataTypes.INTEGER,
      },
      status: {
        type: DataTypes.ENUM(
          REQUEST_STATUS.PENDING,
          REQUEST_STATUS.ACCEPTED,
          REQUEST_STATUS.BOOKED,
          REQUEST_STATUS.MARKED_DONE,
          REQUEST_STATUS.CLOSED,
          REQUEST_STATUS.SETTLED,
          REQUEST_STATUS.DECLINED,
          REQUEST_STATUS.CANCELED
        ),
        default: REQUEST_STATUS.PENDING
      },
      toUserId: {
        type: DataTypes.INTEGER,
        required: true
      }
  }, {
      tableName: "request",
  });

  Request.associate = models => {
    Request.belongsTo(models.task);
    Request.belongsTo(models.user, { as: "fromUser", constraints: true });
    Request.belongsTo(models.user, { as: "toUser", constraints: true });
    Request.hasOne(models.review);
    Request.hasOne(models.order);
  };

  Request.REQUEST_STATUS = REQUEST_STATUS;

  return Request;
};
