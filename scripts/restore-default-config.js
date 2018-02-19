const db = require('../built/app/models/models.js');

const tenantId = process.env.TENANT_ID;
const USECASE = process.argv[2];

if (!USECASE) {
    throw new Error('Specify USECASE');
}

db.create(tenantId, () => {
    db.get(tenantId)
    .appConfig
    .addDefaultConfig(USECASE);
});
