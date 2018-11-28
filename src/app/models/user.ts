import { Sequelize, DataTypes } from "sequelize";

module.exports = (sequelize: Sequelize, dataTypes: DataTypes) => {
  const USER_TYPES = {
    ANY: 0,
    DEMAND: 1,
    SUPPLY: 2
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
      type: dataTypes.ENUM(
        USER_STATUS.UNVERIFIED,
        USER_STATUS.VERIFIED,
        USER_STATUS.DISABLED,
        USER_STATUS.BLOCKED
      )
    },
    accountType: {
      type: dataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: dataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: dataTypes.STRING,
      allowNull: true
    },
    isAdmin: {
      type: dataTypes.BOOLEAN,
      defaultValue: false
    },
    country: {
      type: dataTypes.STRING(2),
      allowNull: true
    },
    website: {
      type: dataTypes.STRING,
      allowNull: true
    },
    bio: {
      type: dataTypes.STRING(1024),
      allowNull: true
    },
    imageUrl: {
      allowNull: true,
      type: dataTypes.STRING
    },
    avgReviewRate: {
      defaultValue: 3,
      type: dataTypes.FLOAT,
    },
    // here it is specified if the user is buyer or seller
    userType: {
      defaultValue: 0,
      type: dataTypes.INTEGER
    },
    username: {
      allowNull: true,
      type: dataTypes.STRING
    },
    addressBCH: {
      allowNull: true,
      type: dataTypes.STRING
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
    User.hasMany(models.billingAddress);
    User.hasMany(models.review, {
      foreignKey: "toUserId"
    });

    User.hasMany(models.userFollower);
  };

  (User as any).USER_STATUS = USER_STATUS;

  return User;
};
