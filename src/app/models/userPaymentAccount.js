module.exports = (sequelize, DataTypes) => {
    const Model = sequelize.define("userPaymentAccount", {
        networkId: { type: DataTypes.ENUM("stripe"), required: true },
        accountId: { type: DataTypes.STRING, required: true },
        publicKey: { type: DataTypes.STRING, required: true },
        secretKey: { type: DataTypes.STRING, required: true },
        data: { type: DataTypes.JSON }
    }, {
        tableName: "userPaymentAccount"
    });

    Model.associate = models => {
        Model.belongsTo(models.user);
    };

    return Model;
};
