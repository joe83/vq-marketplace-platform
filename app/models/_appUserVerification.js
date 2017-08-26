
const async = require('async');
const marketplaceConfig = require('vq-marketplace-config');

module.exports = (sequelize, DataTypes) => {
    const appUserVerification = sequelize.define("appUserVerification", {
        name: {
            type: DataTypes.STRING,
            required: true,
            unique: true
        },
        userType: {
            type: DataTypes.ENUM('1', '2'),
            required: true
        },
        dbName: {
            type: DataTypes.STRING,
            required: true,
        },
        fieldKey: { 
            type: DataTypes.STRING,
            required: true
        },
        steps: { 
            type: DataTypes.STRING,
            required: true
        }
    }, {
        tableName: '_appUserVerification',
    });

    const restoreDefault = () => new Promise((resolve, reject) => {
        const userVerifications = marketplaceConfig.userVerifications();

        async.eachSeries(
            userVerifications,
            (verification, cb) => {
                verification.steps = verification.steps.join(':')
                
                appUserProperty
                .create(verification)
                .then(() => cb(), cb);
            }, err => {
                if (err) {
                    return reject(err);
                }

                return resolve();
            });
    });

    appUserVerification.restoreDefault = restoreDefault;

    return appUserVerification;
};
