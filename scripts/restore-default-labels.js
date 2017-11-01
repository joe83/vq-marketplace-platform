const db = require('../app/models/models.js');

const TENANT_ID = process.env.TENANT_ID;
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

db.create(TENANT_ID, () => {
    db.get(TENANT_ID)
    .appLabel
    .addDefaultLangLabels(TARGET_LANG, USECASE, SHOULD_FORCE)
    .then((data) => {
        console.log(data);
        console.log('Success');

        process.exit();
    });
});
    

