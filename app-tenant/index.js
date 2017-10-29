const async = require("async");
const tenantDb = require('./models');
const utils = require('../app/utils');
const EventEmitter = require('events');
class DefaultEmitter extends EventEmitter {}

const events = new DefaultEmitter();

const rootDbName = 'vq-marketplace';
let models = null;

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

const initRoutes = (app, express) => {
	app.use(express.static(__dirname + '/public'));

	app.get('/api/tenant', (req, res) => {
		getModels((err, tenantModels) => {
			if (err) {
				return cb(err);
			}

			tenantModels.tenant
			.findAll()
			.then((rTenants) => {
				res.send(rTenants.map(_ => _.tenantId));
			}, err => res.status(400).send(err));
		});
	});

	app.post('/api/tenant', (req, res) => {
		let savedTenant = null;
		const tenant = req.body;

		tenant.tenantId = utils.stringToSlug(tenant.marketplaceName);

		if (tenant.tenantId === rootDbName) {
			return res.status(400).send({
				code: 'TENANT_ID_NOT_ALLOWED'
			});
		}

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
		], (err) => {
			if (err) {
				return res.status(400).send(err);
			}

			res.send(savedTenant);
		})
	});
};



module.exports = {
	events,
	getModels,
	initRoutes
};
