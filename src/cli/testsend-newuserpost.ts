require('dotenv').config();

const async = require("async");
const db = require('../app/models/models.js');

const USECASE = "honestcash";
const TENANT_ID = "honestcash";

import UserPostEmitter from "../app/events/userPost";

if (!TENANT_ID) {
    throw new Error("Specify TENANT_ID");
}

if (!USECASE) {
    throw new Error('Specify USECASE');
}

db.create(TENANT_ID, USECASE, async () => {
    const models = db.get(TENANT_ID);

    const userPost = await models.userPost.findOne({ include: [{
        model: models.user
    }], where: { id: 259 }});

    UserPostEmitter.emit("new-user-post", models, userPost);
});
