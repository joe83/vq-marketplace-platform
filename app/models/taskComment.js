module.exports = (sequelize, DataTypes) => {
  const TaskComment = sequelize.define("taskComment", {
      comment: {
        type: DataTypes.TEXT, allowNull: false
      }
  }, {
      tableName: 'taskComment',
  });

  TaskComment.associate = models => {
    TaskComment.belongsTo(models.user);
    TaskComment.belongsTo(models.task);
  };

  return TaskComment;
};