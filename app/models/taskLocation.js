module.exports = (sequelize, DataTypes) => {
  const TaskLocation = sequelize.define("taskLocation", {
    lat: { 
      type: DataTypes.FLOAT,
      required: true
    },
    lng: {
      type: DataTypes.FLOAT,
      required: true
    },
    countryCode: { 
      type: DataTypes.STRING,
      required: true
    },
    street: { 
      type: DataTypes.STRING,
      required: true
    },
    postalCode: {
      type: DataTypes.STRING,
      required: true
    },
    city: {
      type: DataTypes.STRING,
      required: true
    },
    formattedAddress: { type: DataTypes.STRING },
    streetNumber: { type: DataTypes.STRING },
    postalCode: { type: DataTypes.STRING },
    addressAddition: { type: DataTypes.STRING },
    region: { type: DataTypes.STRING }
  }, {
    tableName: 'taskLocation',
    classMethods: {
        associate: models => {
            TaskLocation.belongsTo(models.task);
        }
    }
  });

  return TaskLocation;
};