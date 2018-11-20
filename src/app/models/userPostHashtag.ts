import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: DataTypes) => {
  const UserPostHashtag = sequelize.define("userPostHashtag", {
    hashtag: {
        allowNull: false,
        type: dataTypes.STRING
    }
  }, {
    tableName: "userPostHashtag"
  });

  UserPostHashtag.associate = (models) => {
    UserPostHashtag.belongsTo(models.userPost);
  };

  return UserPostHashtag;
};
