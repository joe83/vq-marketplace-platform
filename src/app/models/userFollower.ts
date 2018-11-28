import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: DataTypes) => {
  const UserFollower = sequelize.define("userFollower", {
      followingId: { type: dataTypes.INTEGER, allowNull: false },
  }, {
    tableName: "userFollower"
  });

  UserFollower.associate = models => {
    UserFollower.belongsTo(models.user);
  };

  return UserFollower;
};
