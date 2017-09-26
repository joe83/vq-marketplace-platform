const models = require('../app/models/models.js');

const USECASE = process.argv[2];
const TARGET_LANG = process.argv[3];

if (!USECASE) {
    throw new Error('Specify USECASE');
}

if (!TARGET_LANG) {
    throw new Error('Specify TARGET_LANG');
}

models
    .appLabel
    .addDefaultLangLabels(TARGET_LANG, USECASE, true)
    .then(() => {
        console.log('Success');

        process.exit();
    });

