module.exports = (sequelize, DataTypes) => {
  const TaskTiming = sequelize.define("taskTiming", {
    type: {
      type: DataTypes.STRING
    },
    date: {
      type: DataTypes.DATE,
      required: true
    },
    endDate: {
      type: DataTypes.DATE,
      required: false
    },
    duration: {
      type: DataTypes.INTEGER,
      default: 0
    }
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