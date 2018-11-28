import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: DataTypes) => {
  const UserPostUpvote = sequelize.define("userPostUpvote", {
    blockchain: {
        allowNull: false,
        defaultValue: "bch",
        type: dataTypes.STRING
    },
    txId: {
        allowNull: false,
        defaultValue: "bch",
        type: dataTypes.STRING,
        unique: true
    }
  }, {
    tableName: "userPostUpvote"
  });

  UserPostUpvote.associate = (models) => {
    UserPostUpvote.belongsTo(models.userPost);
    UserPostUpvote.belongsTo(models.user);
  };

  return UserPostUpvote;
};
