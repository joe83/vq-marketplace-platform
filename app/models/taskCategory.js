module.exports = (sequelize, DataTypes) => {
  const TaskCategory = sequelize.define("taskCategory", {
    code: { type: DataTypes.STRING }
  }, {
    tableName: 'taskCategory',
    classMethods: {
        associate: models => {
            TaskCategory.belongsTo(models.task);
        }
    }
  });

  return TaskCategory;
};