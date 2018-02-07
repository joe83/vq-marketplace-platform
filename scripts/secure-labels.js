const models = require('../built/app/models/models.js');

models
    .appLabel
    .findAll({})
    .then(labels => {

        console.log(JSON.stringify(labels));

        process.exit();
    });

