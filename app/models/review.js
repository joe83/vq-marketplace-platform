module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define("review", {
      body: {
        type: DataTypes.STRING,
      },
      rate: {
        type: DataTypes.INTEGER,
      }
  }, {
      tableName: 'review',
      classMethods: {
        associate: models => {
          Review.belongsTo(models.user, {
              as: 'fromUser'
          });
          Review.belongsTo(models.user, {
              as: 'toUser'
          });
          Review.belongsTo(models.task)
          Review.belongsTo(models.request);
          Review.belongsTo(models.order);
        }
      }
  });

  return Review;
};
