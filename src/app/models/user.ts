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
  
    // here it is specified if the user is buyer or seller
    userType: {
      type: dataTypes.INTEGER,
      defaultValue: 0,
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
      type: dataTypes.STRING,
      allowNull: true
    },
    avgReviewRate: {
      type: dataTypes.FLOAT,
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
    User.hasMany(models.billingAddress);
    User.hasMany(models.review, {
      foreignKey: "toUserId"
    });
  };

  (User as any).USER_STATUS = USER_STATUS;

  return User;
};
