module.exports = (sequelize, DataTypes) => {
  const REQUEST_STATUS = {
    PENDING: '0',
    ACCEPTED: '5',
    MARKED_DONE: '10',
    SETTLED: '15',
    DECLINED: '20',
    CANCELED: '25'
  };

  const Request = sequelize.define("request", {
      status: {
        type: DataTypes.ENUM(
          REQUEST_STATUS.PENDING,
          REQUEST_STATUS.ACCEPTED,
          REQUEST_STATUS.MARKED_DONE,
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
      tableName: 'request',
      classMethods: {
        associate: models => {
          Request.belongsTo(models.task);
          Request.belongsTo(models.user, { as: 'fromUser', constraints: true })
        }
      }
  });

  Request.REQUEST_STATUS = REQUEST_STATUS;

  return Request;
};
