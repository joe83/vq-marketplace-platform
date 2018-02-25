const db = require('../built/app/models/models.js');

const tenantId = process.env.TENANT_ID;

if (!tenantId) {
    return;
}

const models = db.createSeqConnection(tenantId);

models.seq.sync()
    .then(() => {
        console.log("OK");
    }, () => {
        console.log("ERROR");
    });
