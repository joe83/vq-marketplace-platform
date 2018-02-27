require('dotenv').config();

const db = require('../src/app/models/models.js');

const TENANT_ID = process.argv[5] || process.env.TENANT_ID;
const USECASE = process.argv[2];
const TARGET_LANG = process.argv[3];
const SHOULD_FORCE = process.argv[4];

if (!USECASE) {
    throw new Error('Specify USECASE');
}

if (!TARGET_LANG) {
    throw new Error('Specify TARGET_LANG');
}

db.create(TENANT_ID, USECASE, () => {
    console.log('Database created for ' + USECASE + ' marketplace for tenant ' + TENANT_ID);
    db.get(TENANT_ID)
        .appLabel
        .addDefaultLangLabels(TARGET_LANG, USECASE, SHOULD_FORCE, (err, data) => {
            if (err) {
                console.log(err);
            }
            console.log('Labels restored for ' + USECASE + ' marketplace for tenant ' + TENANT_ID);
            process.exit();
        });
});
    

