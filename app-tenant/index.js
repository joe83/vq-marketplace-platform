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

const service = require("./service");

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

			tenantModels
			.tenant
			.findAll({
				where: req.query
			})
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

        let hasResponded = false;

        async.waterfall([
            cb => {
                models
                    .tenant
                    .findOne({
                        where: {
                            $and: [
                                {tenantId},
                                {apiKey}
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

                        res.send(tenant);
                        hasResponded = true;

                        return cb();
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
                                    {tenantId}
                                ]
                            }
                        })
                        .then(() => {
                            return cb();
                        }, cb);
                });
            },
            cb => {
                console.log("Creating first account on newly created marketplace.");

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

                if (!marketplaceModels) {
                    console.log("Marketplace models could not be retrieved.");
                }

                authCtrl
                    .createNewAccount(marketplaceModels, userData, (err, authData) => {
                        return cb(err, authData);
                    });
            },
        ], (err, authData) => {
            if (err) {
                if (!hasResponded) {
                    res.status(err.httpCode || 400).send(err);
                }

                return;
            }

            models
                .tenant
                .update({
                    status: 3
                }, {
                    where: {
                        $and: [
                            {tenantId}
                        ]
                    }
                })
                .then(() => {
                    console.log("Success! Created Marketplace, config and user account.");
                });
        }
        );
    }));

    /* Trial Form User Registration Steps */
    app.post('/api/trial-registration/step-1', (req, res) => {
        const tenant = req.body;

        getModels((err, tenantModels) => {
            if (err) {
                return cb(err);
            }

            tenantModels
            .tenant
            .findOrCreate({
                where: {
                    email: tenant.email
                },
                defaults: {
		            apiKey: randomstring.generate(32)
                }
            })
            .spread((tenant, isNew) => {
                if (!isNew) {
                    return res.status(400).send({
                        httpCode: 400,
                        code: "TENANT_EMAIL_TAKEN"
                    });
                }

                tenant.verificationKey = cryptoService
                .encodeObj(tenant.apiKey);
                /*const VERIFICATON_LINK = config.TENANT_SERVER_URL || 'http://localhost:8081'*/

                emailService.sendNewTenant(tenant.email, "Your verification code is: " + tenant.verificationKey);

                // we should not send here the API KEY
                return res.send({
                    tenant: tenant
                });
            });
        });
    });

    app.post('/api/trial-registration/step-2', (req, res) => {
        // WE SHALL NOT HAVE HERE API KEY. IT IS ENCRYPTED IN THE VER. CODE
        delete req.body.apiKey

        const tenant = req.body;
        let encryptedToken = tenant.verificationCode;
		let apiKey;

		try {
			encryptedToken = encryptedToken.split(' ').join('+');
			apiKey = cryptoService.decodeObj(encryptedToken);
		} catch(err) {
			res.set('Content-Type', 'text/html');
            
            return res.send(new Buffer('<p>Could not verify</p>'));
		}

        getModels((err, tenantModels) => {
            if (err) {
                return cb(err);
            }

           tenantModels
            .tenant
            .findOne({
                where: {
                    apiKey
                }
            })
            .then(rTenant => {
                if (!rTenant) {
                    return res.send({
                        httpCode: 400,
                        code: "WRONG_DATA"
                    });
                }

                return rTenant
                    .update({
                        emailVerified: 1
                    })
                    .then(() => {
                        res.send({
                            tenant: rTenant
                        })
                    }, err => {
                        res.status(400).send(err)
                    });
            }, err => res.status(400).send(err));
        });
    });

    app.post('/api/trial-registration/step-3', (req, res) => {
        const tenant = req.body;

        getModels((err, tenantModels) => {
            if (err) {
                return cb(err);
            }

            tenantModels
            .tenant
            .update({
                firstName: tenant.firstName,
                lastName: tenant.lastName,
                country: tenant.country
            },
            {
              where: {
                apiKey: tenant.apiKey
              }
            })
            .then(tenant => {
                return res.send({
                    tenant: tenant
                });
            }, err => res.status(400).send(err));
        });
    });

    /**
     * It starts the marketplace!
     * This endpoint is called after:
     * 1) tenant has been initialized
     * 2) tenant has confirmed its email
     * 
     * Here the tenant can give a marketplace.
     * 
     * Request:
     * apiKey:YDJkyR6dPdeqtHd05bR3BIqUw3BA8JlM
     * marketplaceName:Adrian
     * password:hello
     * repeatPassword:hello
     */
    app.post('/api/trial-registration/step-4', (req, res) => {
        const tenant = req.body;
        const apiKey = tenant.apiKey;
        const tenantId = utils.stringToSlug(tenant.marketplaceName);
        
        const reserveredKeywords = [ 'blog', rootDbName, 'help' ];
        
        if (reserveredKeywords.indexOf(tenantId) !== -1) {
            return res.status(400)
                .send({
                    code: 'MARKETPLACE_NAME_NOT_ALLOWED'
                });
        }

        let tenantModels;
        let tenantRef;

        async.waterfall([
            cb => {
                getModels((err, rTenantModels) => {
                    if (err) {
                        return cb(err);
                    }

                    tenantModels = rTenantModels;

                    cb();
                });
            },
            cb => tenantModels
                .tenant
                .findOne({
                    where: {
                        tenantId
                    }
                })
                .then(foundTenant => {
                    if (foundTenant) {
                        return cb({
                            httpCode: 400,
                            code: 'MARKETPLACE_NAME_NOT_ALLOWED'
                        });
                    }

                    return cb();
                }, cb),
            cb => tenantModels
                .tenant
                .findOne({
                    where: {
                        apiKey: tenant.apiKey
                    }
                })
                .then(rTenant => {
                    if (!rTenant) {
                        return setTimeout(() => {
                            return cb({
                                httpCode: 400,
                                code: 'WRONG_API_KEY'
                            })
                        }, 500);
                    }
              
                    if (!rTenant.emailVerified) {
                        return cb({
                            httpCode: 400,
                            code: "EMAIL_NOT_VERIFIED"
                        });
                    }

                    // Has api key been used?
                    if (rTenant.status !== 0) {
                        return cb({
                            httpCode: 400,
                            code: "API_KEY_USED"
                        });
                    }

                    tenantRef = rTenant;

                    cb();
                }),
                cb => tenantRef
                    .update({
                        marketplaceName: tenant.marketplaceName,
                        tenantId,
                        status: 1 // 1: deployment triggered
                    })
                    .then(() => cb(), cb),
        ], err => {
            if (err) {
                return res.status(err.httpCode).send(err);
            }
            
            // this can last some time, up to one minute, it should be run async
            service.deployNewMarketplace(tenantId, apiKey, tenant.password, tenant.repeatPassword, (err, authData) => {
                console.log("MARKETPLACE CREATED");
            });

            res.send(tenantRef);
        });
    });
};


module.exports = {
	getModels,
	initRoutes
};
