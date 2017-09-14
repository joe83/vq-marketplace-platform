module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define("review", {
      body: {
        type: DataTypes.STRING(2048),
      },
      rate: {
        type: DataTypes.ENUM('0', '1', '2', '3', '4', '5'),
      }
  }, {
      tableName: 'review'
  });

  Review.associate = models => {
    Review.belongsTo(models.user, {
      as: 'fromUser'
    });
    Review.belongsTo(models.user, {
        as: 'toUser'
    });
    Review.belongsTo(models.task);
    Review.belongsTo(models.request);
    Review.belongsTo(models.order);
  };

  return Review;
};
