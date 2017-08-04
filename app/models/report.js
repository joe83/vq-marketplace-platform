module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define("report", {
    reportName: {
      unique: true,
      type: DataTypes.STRING,
      required: true
    },
    reportValue: {
      type: DataTypes.INTEGER
    }
  }, {
    classMethods: {
        associate: models => {}
    }
  });

  return Report;
};
