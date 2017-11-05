const db = require('../app/models/models.js');

if (!process.env.TENANT_ID) {
    throw new Error("Specify TENANT_ID");
}

const TENANT_ID = process.env.TENANT_ID;

db.create(TENANT_ID, () => {
    db.get(TENANT_ID).post.addDefaultPosts('services', true, err => {
        console.log("ADDED", err)
    });  
});
