const db = require('../app/models/models.js');

if (!process.env.TENANT_ID) {
    throw new Error("Specify TENANT_ID");
}

const TENANT_ID = process.env.TENANT_ID;
const USECASE = process.argv[2];

if (!USECASE) {
    throw new Error('Specify USECASE');
}

db.create(TENANT_ID, () => {
    db.get(TENANT_ID).post.addDefaultPosts(USECASE, true, err => {
        console.log("ADDED", err)
    });  
});
