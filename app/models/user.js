module.exports = (sequelize, DataTypes) => {
  const USER_TYPES = {
    ANY: 0,
    BUYER: 1,
    SELLER: 2
  };

  const USER_STATUS = {
    UNVERIFIED: '0',
    VERIFIED: '10',
    DISABLED: '15',
    BLOCKED: '20'
  };

  const User = sequelize.define("user", {
    vqUserId: {
      type: DataTypes.INTEGER,
      required: true,
      unique: true
    },
    status: {
      default: USER_STATUS.UNVERIFIED,
      type: DataTypes.ENUM(
        USER_STATUS.UNVERIFIED,
        USER_STATUS.VERIFIED,
        USER_STATUS.DISABLED,
        USER_STATUS.BLOCKED
      )
    },
    accountType: {
      type: DataTypes.STRING,
      required: true
    },
    // here it is specified if the user is buyer or seller
    userType: {
      type: DataTypes.INTEGER,
      default: 0,
      required: true
    },
    firstName: {
      type: DataTypes.STRING,
      required: true
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      required: false,
      default: false
    },
    lastName: {
      type: DataTypes.STRING,
      required: true
    },
    website: {
      type: DataTypes.STRING
    },
    bio: {
      type: DataTypes.STRING
    },
    imageUrl: {
      type: DataTypes.STRING
    },
  }, {
    paranoid: true,
    tableName: 'user',
    classMethods: {
        associate: models => {
          User.hasMany(models.userProperty);
          User.hasMany(models.userPreference);
        }
    }
  });

  User.USER_STATUS = USER_STATUS;

  return User;
};
