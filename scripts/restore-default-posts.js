const db = require('../app/models/models.js');

db.create('testmarketplace', () => {
    db.get('testmarketplace').post.addDefaultPosts('services', true);  
});
