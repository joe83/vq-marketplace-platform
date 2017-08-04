const models  = require('../models/models');

module.exports = app => {
    app.get("/api/app_user_property", (req, res) =>
        models.appUserProperty
        .findAll({ order: [ 'propKey' ] })
        .then(data => res.status(200).send(data))
        .catch(err => res.status(400).send(err))
    );
};
