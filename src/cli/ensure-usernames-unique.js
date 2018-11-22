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
    const users = await db.get(TENANT_ID).user.findAll({});
    const usernames = [];

    async.eachSeries(users, async (user, cb) => {
        if (usernames.indexOf(user.username) > -1) {
            user.username = `${user.username}1`;

            await user.save();
        }

        usernames.push(user.username);

        cb();
    }, err => {
        console.log(err);
    })
});
