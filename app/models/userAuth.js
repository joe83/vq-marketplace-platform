module.exports = (sequelize, DataTypes) => {
    const Model = sequelize.define("userAuth", {
        status: {
            type: DataTypes.INTEGER, 
            defaultValue: 0
        }
    }, {
        tableName: 'auth_user',
    });

    Model.associate = models => {
    };

    return Model;
};