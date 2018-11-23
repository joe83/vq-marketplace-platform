require('dotenv').config();

const async = require("async");
const db = require('../app/models/models.js');
import { cleanHashtag } from "../app/utils";

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

    const userPostHashtags = await models.userPostHashtag.findAll();

    for (let userPostHashtag of userPostHashtags) {
        userPostHashtag.hashtag = cleanHashtag(userPostHashtag.hashtag);

        await userPostHashtag.save();
    }
});
