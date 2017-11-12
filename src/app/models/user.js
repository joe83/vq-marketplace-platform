module.exports = (sequelize, DataTypes) => {
  const USER_TYPES = {
    ANY: 0,
    BUYER: 1,
    SELLER: 2
  };

  const USER_STATUS = {
    UNVERIFIED: "0",
    VERIFIED: "10",
    DISABLED: "15",
    BLOCKED: "20"
  };

  const User = sequelize.define("user", {
    status: {
      defaultValue: USER_STATUS.UNVERIFIED,
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
      defaultValue: 0,
      required: true
    },
    firstName: {
      type: DataTypes.STRING,
      required: true
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      required: false,
      defaultValue: false
    },
    country: {
      type: DataTypes.STRING(2),
      required: false,
      defaultValue: false
    },
    lastName: {
      type: DataTypes.STRING,
      required: true
    },
    website: {
      type: DataTypes.STRING
    },
    bio: {
      type: DataTypes.STRING(1024)
    },
    imageUrl: {
      type: DataTypes.STRING
    },
    avgReviewRate: {
      type: DataTypes.FLOAT,
      defaultValue: 3
    }
  }, {
    paranoid: true,
    tableName: "user"
  });

  User.associate = models => {
    User.belongsTo(models.userAuth, {
      as: "vqUser"
    });

    User.hasMany(models.userProperty);
    User.hasMany(models.userPreference);
    User.hasMany(models.review, {
      foreignKey: "toUserId"
    });
  };

  User.USER_STATUS = USER_STATUS;

  return User;
};
