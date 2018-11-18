require('dotenv').config();

const db = require('../app/models/models.js');


const USECASE = process.argv[2];
const TENANT_ID = process.argv[3] || process.env.TENANT_ID;

if (!TENANT_ID) {
    throw new Error("Specify TENANT_ID");
}

if (!USECASE) {
    throw new Error('Specify USECASE');
}

db.create(TENANT_ID, USECASE, () => {
    console.log('Database created for ' + USECASE + ' marketplace for tenant ' + TENANT_ID);
    db.get(TENANT_ID).post.addDefaultPosts(USECASE, true, (err, data) => {
        if (err) {
            console.log(err);
        }
        console.log('Labels restored for ' + USECASE + ' marketplace for tenant ' + TENANT_ID);
        process.exit();
    });  
});
