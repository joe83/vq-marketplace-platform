const async = require("async");
const models  = require('../models/models');
const responseController = require("../controllers/responseController.js");
const isAdmin = responseController.isAdmin;

module.exports = app => {
    const getLabels = lang => new Promise((resolve, reject) => {
            const where = {
                lang
            };
        
            models.appLabel
                .findAll({
                    where, order: [ 'labelKey' ]
                })
                .then(labels => resolve(labels));
    });

    app.get("/api/app_label", (req, res) =>
        req.query.lang ? 
            getLabels(req.query.lang).then(labels => res.send(labels), err => res.status(400).send(err)) :
            res.status(400).send('Specify language')
    );

    app.post("/api/app_label", isAdmin, (req, res) => {
        const labels = req.body || [];

        const forceUpdate = true;

        models.appLabel.bulkCreateOrUpdate(labels, forceUpdate)
            .then(nothing => res.send({ ok: true }));
    });
};
