module.exports = (sequelize, DataTypes) => {
  const TaskTiming = sequelize.define("taskTiming", {
    type: {
      type: DataTypes.STRING
    },
    date: {
      type: DataTypes.INTEGER(16),
      required: true
    },
    endDate: {
      type: DataTypes.INTEGER(16),
      required: false
    },
    duration: {
      type: DataTypes.INTEGER,
      default: 0
    }
  }, {
    tableName: "taskTiming"
  });

  TaskTiming.associate = models => {
    TaskTiming.belongsTo(models.task);
  };

  return TaskTiming;
};