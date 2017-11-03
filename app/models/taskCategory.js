module.exports = (sequelize, DataTypes) => {
  const TaskCategory = sequelize.define("taskCategory", {
    code: { type: DataTypes.STRING }
  }, {
    tableName: "taskCategory"
  });

  TaskCategory.associate = models => {
    TaskCategory.belongsTo(models.task);
  };

  return TaskCategory;
};