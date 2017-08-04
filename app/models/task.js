module.exports = (sequelize, DataTypes) => {
  const TASK_STATUS = {
    ACTIVE: 0,
    INACTIVE: 103,
    CREATION_IN_PROGRESS: 10
  };

  const PRICE_TYPE = {
    PER_CONTRACT: 0,
    PER_HOUR: 1,
    ON_REQUEST: 2
  };

  const SUPPORTED_CURRENCIES = [ 'HUF', 'EUR' ];

  const Task = sequelize.define("task", {
    taskType: { type: DataTypes.INTEGER },
    currency: { 
      type: DataTypes.ENUM(SUPPORTED_CURRENCIES)
    },
    priceType: { type: DataTypes.INTEGER },
    price: { type: DataTypes.INTEGER },
    title: {
      type: DataTypes.STRING,
      required: true
    },
    description: { 
      type: DataTypes.STRING(2048) 
    },
    status: {
      type: DataTypes.INTEGER, defaultValue: TASK_STATUS.CREATION_IN_PROGRESS
    }
  }, {
    tableName: 'task',
    classMethods: {
        associate: models => {
            Task.belongsTo(models.user);
            Task.hasMany(models.taskCategory);
            Task.hasMany(models.taskImage);
            Task.hasMany(models.taskLocation);
            Task.hasMany(models.taskComment);
            Task.hasMany(models.taskTiming);
            Task.hasMany(models.request);
        }
    }
  });

  return Task;
};