module.exports = (sequelize, DataTypes) => {
  /**
   * User properties can be implicit or explicit. If explicit, they will have specified integer rating
   */
  const UserProperty = sequelize.define("userProperty", {
    propKey: {
      type: DataTypes.STRING,
      required: true
    },
    propRating: {
      type: DataTypes.INTEGER
    },
    propValue: {
      type: DataTypes.STRING,
      required: true
    }
  }, {
    tableName: "userProperty",
  });

  UserProperty.associate = models => {
    UserProperty.belongsTo(models.user);
  };

  return UserProperty;
};
