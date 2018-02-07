const tenantDb = require("./models");

const rootDbName = "vq-marketplace";

let models;

const getModels = cb => {
    if (models) {
        return cb(null, models);
    }

    tenantDb.create(rootDbName, err => {
        if (err) {
            return cb(err);
        }

        models = tenantDb.get(rootDbName);

        return cb(null, models);
    });
};

module.exports = {
    rootDbName,
    getModels
};
