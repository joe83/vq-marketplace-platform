module.exports = (sequelize, DataTypes) => {
    const UserCategoryPreference = sequelize.define("userPreference", {
        value: {
            type: DataTypes.STRING,
            required: true
        },
        type: {
            type: DataTypes.STRING,
            required: true
        }
    }, {
      tableName: 'userPreference',
      classMethods: {
        associate: models => {
            UserCategoryPreference.belongsTo(models.user);
        }
      }
    });
  
    return UserCategoryPreference;
  };
  