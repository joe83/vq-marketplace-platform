module.exports = (sequelize, DataTypes) => {
  const TASK_STATUS = {
    ACTIVE: "0",
    CREATION_IN_PROGRESS: "10",
    BOOKED: "20",
    COMPLETED: "30",
    SPAM: "99",
    INACTIVE: "103",
  };

  const PRICE_TYPE = {
    PER_CONTRACT: 0,
    PER_HOUR: 1,
    ON_REQUEST: 2
  };

  const SUPPORTED_CURRENCIES = [
    "HUF",
    "EUR",
    "USD",
    "PLN",
    "CAD"
  ];

  const Task = sequelize.define("task", {
    taskType: { type: DataTypes.INTEGER },
    currency: { 
      type: DataTypes.ENUM(SUPPORTED_CURRENCIES)
    },
    priceType: { type: DataTypes.INTEGER },
    price: { type: DataTypes.INTEGER },
    quantity: { type: DataTypes.INTEGER },
    unitOfMeasure: { type: DataTypes.STRING },
    title: {
      type: DataTypes.STRING,
      required: true
    },
    description: { 
      type: DataTypes.STRING(2048) 
    },
    callToActionLabel: { 
      type: DataTypes.STRING(64) 
    },
    callToActionUrl: {
      type: DataTypes.STRING(254) 
    },
    status: {
      type: DataTypes.ENUM(
        TASK_STATUS.ACTIVE,
        TASK_STATUS.CREATION_IN_PROGRESS,
        TASK_STATUS.BOOKED,
        TASK_STATUS.COMPLETED,
        TASK_STATUS.SPAM,
        TASK_STATUS.INACTIVE,
      ),
      defaultValue: TASK_STATUS.CREATION_IN_PROGRESS
    }
  }, {
    tableName: "task"
  });

  Task.TASK_STATUS = TASK_STATUS;

  Task.associate = models => {
    Task.belongsTo(models.user);
    Task.hasMany(models.taskLocation);
    Task.hasMany(models.taskCategory);
    Task.hasMany(models.taskImage);
    Task.hasMany(models.taskComment);
    Task.hasMany(models.taskTiming);
    Task.hasMany(models.request);
    Task.hasMany(models.review);
  };

  return Task;
};