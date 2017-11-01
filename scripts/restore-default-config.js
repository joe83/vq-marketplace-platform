const db = require('../app/models/models.js');

const tenantId = process.env.TENANT_ID;

db.create(tenantId, () => {
    db.get(tenantId)
    .appConfig
    .addDefaultConfig("services");
});
