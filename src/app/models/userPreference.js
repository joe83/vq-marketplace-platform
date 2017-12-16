module.exports = (sequelize, DataTypes) => {
    const UserPreference = sequelize.define("userPreference", {
        value: {
            type: DataTypes.STRING,
            required: true
        },
        type: {
            type: DataTypes.STRING,
            required: true
        }
    }, {
      tableName: "userPreference",
    });
  
    UserPreference.associate = models => {
        UserPreference.belongsTo(models.user);
    };

    return UserPreference;
  };
  