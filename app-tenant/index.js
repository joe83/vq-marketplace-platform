const async = require("async");
const tenantDb = require('./models');
const utils = require('../app/utils');
const EventEmitter = require('events');
class DefaultEmitter extends EventEmitter {}

const events = new DefaultEmitter();

const dbName = 'vq-marketplace';
let models = null;

const getModels = cb => {
	if (models) {
		return cb(null, models);
	}

	tenantDb.create(dbName, err => {
		if (err) {
			return cb(err);
		}

		models = tenantDb.get(dbName);

		return cb(null, models);
	});
};

const initRoutes = (app, express) => {
	app.use(express.static(__dirname + '/public'));

	app.post('/app', (req, res) => {
		
	});

	app.post('/api/tenant', (req, res) => {
		let savedTenant = null;
		const tenant = req.body;

		tenant.tenantId = utils.stringToSlug(tenant.marketplaceName);

		async.waterfall([
			cb => getModels((err, tenantModels) => {
				if (err) {
					return cb(err);
				}

				tenantModels.tenant.create(tenant)
				.then((rTenant) => {
					savedTenant = rTenant;

					events.emit('new-tenant', rTenant);

					cb();
				}, cb)
			})
		])
	});
};



module.exports = {
	events,
	getModels,
	initRoutes
};
