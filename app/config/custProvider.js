const async = require("async");
const models  = require('../models/models');

const appConfig = {};

const getConfig = () => new Promise((resolve, reject) => {
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
