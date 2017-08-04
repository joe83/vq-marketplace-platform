module.exports = (sequelize, DataTypes) => {
  const TaskImage = sequelize.define("taskImage", {
    imageUrl: { type: DataTypes.STRING }
  }, {
    tableName: 'taskImage',
    classMethods: {
        associate: models => {
            TaskImage.belongsTo(models.task);
        }
    }
  });

  return TaskImage;
};