const models = require('../src/app/models/models.js');

models
    .appLabel
    .findAll({})
    .then(labels => {

        console.log(JSON.stringify(labels));

        process.exit();
    });

