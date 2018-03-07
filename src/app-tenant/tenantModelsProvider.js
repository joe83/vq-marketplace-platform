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

const getTenant = ({ tenantId, email }, cb) => {
	getModels
	.getModels((err, tenantModels) => {
		if (err) {
			return cb(err);
		}

        const whereObj = {};

        if (tenantId) {
            whereObj.tenantId = tenantId;
        }

        if (tenantId) {
            whereObj.email = email;
        }

		tenantModels
		.tenant
		.findOne({
			where: whereObj
		})
		.then(tenantRef => {
			if (!tenantRef) {
				return cb({
					code: "TENANT_NOT_FOUND",
					httpCode: 400
				});
			}

			cb(undefined, tenantRef, tenantModels);
		})
		.catch(cb);
	});
};

module.exports = {
    rootDbName,
    getModels,
    getTenant
};
