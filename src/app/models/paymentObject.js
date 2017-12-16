module.exports = (sequelize, DataTypes) => {
    const PaymentObject = sequelize.define("paymentObject", {
        provider: {
          allowNull: false,
          // planned support for two providers in the beginning
          type: DataTypes.ENUM("stripe", "barion"),
          required: true
        },
        type: {
            allowNull: false,
            // extend as needed
            type: DataTypes.ENUM("charge", "card", "customer"),
            required: true
        },
        // we get it directly from payment gataway and store for further reference
        objId: {
            type: DataTypes.STRING,
            required: false
        },
        // dumping data if needed
        obj: {
            type: DataTypes.JSON,
            required: false
        }
    }, {
        tableName: "paymentObject"
    });
  
    PaymentObject.associate = models => {
        PaymentObject.belongsTo(models.user);
        PaymentObject.belongsTo(models.order);
    };
  
    return PaymentObject;
  };
  