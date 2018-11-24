require('dotenv').config();

const async = require("async");
const db = require('../app/models/models.js');

const USECASE = "honestcash";
const TENANT_ID = "honestcash-dev";

if (!TENANT_ID) {
    throw new Error("Specify TENANT_ID");
}

if (!USECASE) {
    throw new Error('Specify USECASE');
}

db.create(TENANT_ID, USECASE, () => {
    process.exit();
});
