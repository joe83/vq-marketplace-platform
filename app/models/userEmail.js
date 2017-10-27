module.exports = (sequelize, DataTypes) => {
    const Model = sequelize.define("userEmail", {
        email: { type: DataTypes.STRING, required: true },
        verified: { type: DataTypes.BOOLEAN, defaultValue: 0 }
    }, {
        tableName: 'auth_userEmail'
    });

    Model.associate = models => {
        Model.belongsTo(models.userAuth, { as: 'user' });
    };

    return Model;
};
