const models = require('../app/models/models.js');

const USECASE = process.argv[2];
const TARGET_LANG = process.argv[3];
const SHOULD_FORCE = process.argv[4];

if (!USECASE) {
    throw new Error('Specify USECASE');
}

if (!TARGET_LANG) {
    throw new Error('Specify TARGET_LANG');
}

console.log(USECASE, TARGET_LANG, SHOULD_FORCE);

models
    .appLabel
    .addDefaultLangLabels(TARGET_LANG, USECASE, SHOULD_FORCE)
    .then(() => {
        console.log('Success');

        process.exit();
    });

