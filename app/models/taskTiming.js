module.exports = (sequelize, DataTypes) => {
  const TaskTiming = sequelize.define("taskTiming", {
    type: { type: DataTypes.STRING },
    date: { type: DataTypes.DATE, required: true }
  }, {
    tableName: 'taskTiming',
    classMethods: {
        associate: models => {
            TaskTiming.belongsTo(models.task);
        }
    }
  });

  return TaskTiming;
};