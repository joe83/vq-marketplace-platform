const models = require('../app/models/models.js');

const TARGET_LANG = process.argv[2];

if (!TARGET_LANG) {
    throw new Error('Specify TARGET_LANG');
}

models
    .appLabel
    .addDefaultLangLabels(TARGET_LANG, true)
    .then(() => {
        console.log('Success');

        process.exit();
    });

