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

    const userEmail = await models.userEmail.findOne({ where: {email: ""} });

    const vqUser = await models.userAuth.findOne({ where: {id: userEmail.userId} });

    const user = await models.user.findOne({ where: {id: vqUser.userId} });

    console.log(user);
});
