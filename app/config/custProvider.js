const async = require("async");

const appConfig = {};

const getConfig = (models) => new Promise((resolve, reject) => {
    models.appConfig
        .findAll({ order: [ 'fieldKey' ] })
        .then(configs => {
            configs.map(config => {
                appConfig[config.fieldKey] = config.fieldValue;
            });

            resolve(appConfig)
        }, err => reject(err))
});

module.exports = { 
    getConfig
}; 
