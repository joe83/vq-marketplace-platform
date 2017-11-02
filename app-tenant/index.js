const async = require("async");
const randomstring = require('randomstring');
const db = require('../app/models/models');
const tenantDb = require('./models');
const config = require("../app/config/configProvider.js")();
const utils = require('../app/utils');
const workers = require('../app/workers');
const authCtrl = require("../app/controllers/authCtrl");
const cryptoService = require("../app/services/cryptoService");
const emailService = require("../app/services/emailService.js");


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

	app.get('/api/tenant/:tenantId', (req, res) => {
		getModels((err, tenantModels) => {
			if (err) {
				return cb(err);
			}

			tenantModels.tenant
			.findOne({
				where: {
					tenantId: req.params.tenantId
				}
			})
			.then((rTenant) => {
				if (!rTenant) {
					return res.status(404).send({
						code: "NOT_FOUND"
					});
				}

				return res.send({
					id: rTenant.id,
					tenantId: rTenant.tenantId,
					marketplaceName: rTenant.marketplaceName,
					marketplaceType: rTenant.marketplaceType,
					status: rTenant.status || null
				});
			}, err => res.status(400).send(err));
		});
	});

	app.post('/api/tenant', (req, res) => {
		let savedTenant = null;
		const tenant = req.body;

		tenant.tenantId = utils.stringToSlug(tenant.marketplaceName);
		tenant.apiKey = randomstring.generate(32);

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

				tenantModels
				.tenant
				.create(tenant)
				.then((rTenant) => {
					savedTenant = rTenant;

					cb();
				}, err => {
					if (err.name === 'SequelizeUniqueConstraintError') {
						return cb({
							code: 'MARKETPLACE_NAME_TAKEN'
						});
					}

					cb(err);
				})
			}),
			cb => {
				const VERIFICATION_LINK = cryptoService
					.buildVerificationUrl(tenant.tenantId, config.TENANT_SERVER_URL || 'http://localhost:8081', {
						id: savedTenant.id
					});
			
				emailService.sendNewTenant(savedTenant.email, VERIFICATION_LINK);

				cb();
			}
		], (err) => {
			if (err) {
				return res.status(400).send(err);
			}

			res.send(savedTenant);
		});
	});

	app.get('/api/verify/email', (req, res) => {
		let encryptedToken = req.query.code;
		let tenantPrimaryId;
		let tenantRef;

		try {
			encryptedToken = encryptedToken.split(' ').join('+');
			
			tenantPrimaryId = cryptoService.decodeObj(encryptedToken).id;
		} catch(err) {
			res.set('Content-Type', 'text/html');
			res.send(new Buffer('<p>Could not verify</p>'));
		}

		async.waterfall([
			cb => getModels((err, tenantModels) => {
				if (err) {
					return cb(err);
				}

				tenantModels
				.tenant
				.findById(tenantPrimaryId)
				.then((rTenant) => {
					tenantRef = rTenant;

					cb();
				}, cb)
			}),
			cb => {
				tenantRef
				.update({
					emailVerified: true
				})
				.then(() => {
					cb();
				}, cb);
			},
			
		], (err) => {
			if (err) {
				return res.status(400).send(err);
			}

			res.redirect(`${config.TENANT_SERVER_URL || 'http://localhost:8081'}/onboarding?apiKey=${tenantRef.apiKey}&tenantId=${tenantRef.tenantId}`);
		})
	});

	app.post('/api/marketplace', (req, res) => getModels((err, models) => {
		const tenantId = req.body.tenantId;
		const apiKey = req.body.apiKey;
		let tenantRef;

		const data = {
			password: req.body.password,
			repeatPassword: req.body.repeatPassword
		};

		async.waterfall([
			cb => {
					models
					.tenant
					.findOne({
						where: {
							$and: [
								{ tenantId },
								{ apiKey }
							]
						}
					})
					.then(tenant => {
						if (!tenant) {
							return cb({
								httpCode: 400,
								code: "WRONG_REQUEST"
							});
						}

						if (!tenant.emailVerified) {
							return cb({
								httpCode: 400,
								code: "EMAIL_NOT_VERIFIED"
							});
						}

						if (tenant.status !== 0) {
							return cb({
								httpCode: 400,
								code: "ALREADY_DEPLOYED"
							});
						}

						tenantRef = tenant;

						cb();
					}, cb);
			},
			cb => {
				db.create(tenantId, err => {
					if (err) {
						return cb(err);
					}

					workers.registerWorkers(tenantId);

					models
					.tenant
					.update({
						status: 2
					}, {
						where: {
							$and: [
								{ tenantId }
							]
						}
					})
					.then(() => {
						cb();
					}, cb);
				});
			},
			cb => {
				const userData = {
					firstName: tenantRef.firstName,
					lastName: tenantRef.lastName,
					email: tenantRef.email,
					userType: 0,
					isAdmin: true,
					accountType: "PRIVATE",
					password: data.password,
					repeatPassword: data.repeatPassword,
				};

				const marketplaceModels = db.get(tenantId);

				authCtrl.createNewAccount(marketplaceModels, userData, (err, authData) => {
					return cb(err, authData);
				});
			},
		], (err, authData) => {
			if (err) {
				return res.status(err.httpCode || 400).send(err);
			}

			res.send(authData);
		});
	}));
};



module.exports = {
	getModels,
	initRoutes
};
