const async = require("async");
const models  = require('../models/models');
const responseController = require("../controllers/responseController.js");
const isAdmin = responseController.isAdmin;

module.exports = app => {
    app.get("/api/app_label", (req, res) => {
        const lang = req.query.lang;

        if (lang) {
            return req.models.appLabel
                .findAll({
                    where: {
                        lang
                    }, order: [ 'labelKey' ]
                })
                .then(labels => res.send(labels), err => res.status(400).send(err))
        }
  
        res.status(400).send('Specify language')
    });

    app.post("/api/app_label", isAdmin, (req, res) => {
        const labels = req.body || [];

        const forceUpdate = true;

        req.models.appLabel.bulkCreateOrUpdate(labels, forceUpdate)
            .then(nothing => res.send({ ok: true }));
    });
};
