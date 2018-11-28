import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: DataTypes) => {
  const UserPost = sequelize.define("userPost", {
    alias: {
        allowNull: true,
        type: dataTypes.STRING
    },
    body: {
        allowNull: true,
        type: dataTypes.TEXT
    },
    description: {
        allowNull: true,
        type: dataTypes.STRING
    },
    imageUrl: {
        allowNull: true,
        type: dataTypes.STRING
    },
    languageCode: {
        allowNull: true,
        type: dataTypes.STRING
    },
    postTypeId: {
        type:   dataTypes.ENUM,
        values: [ "article" ]
    },
    readTime: {
        allowNull: true,
        type: dataTypes.STRING
    },
    status: {
        defaultValue: "draft",
        type:   dataTypes.ENUM,
        values: [ "published", "draft", "spam" ]
    },
    title: {
        allowNull: true,
        type: dataTypes.STRING
    }
  }, {
    tableName: "userPost"
  });

  UserPost.associate = (models) => {
    UserPost.hasMany(models.userPost, {
        foreignKey: "parentPostId"
    });
    UserPost.hasMany(models.userPostHashtag);
    UserPost.hasMany(models.userPostUpvote);
    UserPost.belongsTo(models.user);
  };

  return UserPost;
};
