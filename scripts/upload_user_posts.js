require('dotenv').config();

const db = require('../build/app/models/models.js');

const userPosts = require("./user_posts.json").filter(_ => _.post_type_id === "3" || _.post_type_id === "2");

db.create("honestcash", null, () => {
    userPosts.forEach(userPost => {
        if (!userPost.title) {
            return;
        }

        db.get("honestcash").userPost.create({
            status: "published",
            postTypeId: "article",
            alias: userPost.alias,
            body: userPost.body,
            description: userPost.description,
            title: userPost.title,
            userId: 1,
        });
    });
});
