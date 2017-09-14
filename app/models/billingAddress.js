module.exports = (sequelize, DataTypes) => {
  const BillingAddress = sequelize.define("billingAddress", {
    name: {
        type: DataTypes.STRING,
        required: true
    },
    numberVAT: {
        type: DataTypes.STRING,
        required: true
    },
    countryCode: { 
        type: DataTypes.STRING,
        required: true
    },
    street: {
        type: DataTypes.STRING,
        required: true
    },
    streetNumber: {
        type: DataTypes.STRING
    },
    addressAddition: {
        type: DataTypes.STRING
    },
    postalCode: {
        type: DataTypes.STRING,
        required: true
    },
    postalCode: { 
        type: DataTypes.STRING
    },
    city: {
        type: DataTypes.STRING,
        required: true
    },
    region: { 
        type: DataTypes.STRING
    },
    taxNumber: {
        type: DataTypes.STRING,
        required: false
    },
    default: { 
        type: DataTypes.BOOLEAN, default: false
    }
  }, {
    tableName: 'billingAddress',
  });

  BillingAddress.associate = models => {
    BillingAddress.belongsTo(models.user);
  };

  return BillingAddress;
};
