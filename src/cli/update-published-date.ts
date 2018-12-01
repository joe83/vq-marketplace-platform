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

    const userpost = await models.userPost.findById(211);

    userpost.updatedAt = new Date();
    try {
        await userpost.save();
    } catch (err) {
        throw err;
    }

    const up = await models.userPost.findById(211);

    console.log(up.updatedAt, up.createdAt, up.publishedAt);
});
