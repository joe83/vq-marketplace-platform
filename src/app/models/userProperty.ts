import { Sequelize, DataTypes } from "sequelize";

module.exports = (sequelize: Sequelize, dataTypes: DataTypes) => {
  const UserProperty = sequelize.define("userProperty", {
    propKey: {
      type: dataTypes.STRING,
      allowNull: false
    },
    propValue: {
      type: dataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: "userProperty",
  });

  UserProperty.associate = models => {
    UserProperty.belongsTo(models.user);
  };

  return UserProperty;
};
