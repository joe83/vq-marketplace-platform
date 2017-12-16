const responseController = require("../controllers/responseController.js");
const isAdmin = responseController.isAdmin;

module.exports = app => {
    app.get("/api/app_config", (req, res) =>
        req.models
            .appConfig
            .findAll({
                order: [ "fieldKey" ]
            })
            .then(configs => {
                const resConfigs = JSON.parse(JSON.stringify(configs));

                // Never ever send it down.
                let STRIPE_PRIVATE_KEY = resConfigs.find(_ => _.fieldKey === "STRIPE_PRIVATE_KEY");

                if (STRIPE_PRIVATE_KEY)
                    STRIPE_PRIVATE_KEY.fieldValue = "XXXXXXXXXXXXXXXXXXXXXXXX";

                res.send(resConfigs);
            }, err => res.status(400).send(err))
    );

    app.post("/api/app_config", isAdmin, (req, res) => {
        const labels = req.body || [];

        req
        .models
        .appConfig
        .bulkCreateOrUpdate(labels, true, err => {
            if (err) {
                return res.status(400).send(err);
            }

            res.send({
                ok: true
            });
        });
    });
};
