import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: DataTypes) => {
  const UserProperty = sequelize.define("userPost", {
    alias: {
      allowNull: false,
      type: dataTypes.STRING
    },
    body: {
        allowNull: false,
        type: dataTypes.STRING
    },
    description: {
        allowNull: false,
        type: dataTypes.STRING
    },
    imageUrl: {
        allowNull: false,
        type: dataTypes.STRING
    },
    languageCode: {
        allowNull: false,
        type: dataTypes.STRING
    },
    postTypeId: {
        allowNull: false,
        type: dataTypes.STRING
    },
    readTime: {
        allowNull: false,
        type: dataTypes.STRING
    },
    status: {
        allowNull: false,
        type: dataTypes.STRING
    },
    title: {
        allowNull: false,
        type: dataTypes.STRING
    }
  }, {
    tableName: "userPost",
  });

  UserProperty.associate = (models) => {
    UserProperty.belongsTo(models.user);
  };

  return UserProperty;
};
