require('dotenv').config();

const async = require("async");
const db = require('../app/models/models.js');

const USECASE = "honestcash";
const TENANT_ID = "honestcash";

if (!TENANT_ID) {
    throw new Error("Specify TENANT_ID");
}

if (!USECASE) {
    throw new Error('Specify USECASE');
}

db.create(TENANT_ID, USECASE, async () => {

    const models = db.get(TENANT_ID);

    const users = await models.user.findAll({ where: { status: "10" }});

    for (user of users) {
        const userEmails = await models.userEmail.findAll({ where: { userId: user.vqUserId }});

        for (user of userEmails) {
            userEmail.forEach(_ => console.log(_.email))
        }
    }
});
