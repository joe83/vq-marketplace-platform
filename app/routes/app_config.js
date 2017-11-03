const async = require("async");
const models  = require('../models/models');
const responseController = require("../controllers/responseController.js");
const isAdmin = responseController.isAdmin;

module.exports = app => {
    app.get("/api/app_config", (req, res) =>
        req.models.appConfig
            .findAll({ order: [ 'fieldKey' ] })
            .then(configs => res.send(configs), err => res.status(400).send(err))
    );

    app.post("/api/app_config", isAdmin, (req, res) => {
        const labels = req.body || [];

        const forceUpdate = true;

        req.models.appConfig.bulkCreateOrUpdate(labels, forceUpdate, err => {
            if (err) {
                res.status(400).send(err);
            }

            res.send({ ok: true });
        });
    });
};
