const async = require("async");
const tableName = "_posts";

module.exports = (sequelize, DataTypes) => {
  const posts = sequelize.define("post", {
      title: { type: DataTypes.STRING, required: true },
      code: { type: DataTypes.STRING, required: true, unique: true },
      type: { type: DataTypes.STRING, required: true },
      body: { type: DataTypes.TEXT },
      // 180221, added for emails
      targetUserType: { type: DataTypes.INTEGER },
      eventTrigger: { type: DataTypes.ENUM("new-order") },
  }, {
      tableName,
      createdAt: false,
      updatedAt: false
  });

  posts.createOrUpdate = () => (postCode, postType, postTitle, postBody, postTargetUserType, postEventTrigger) => posts
    .findOne({ where: { code: postCode } })
    .then(obj => {
        if (!obj) {
            return posts.create({ 
                code: postCode,
                title: postTitle,
                type: postType,
                body: postBody,
                targetUserType: postTargetUserType,
                eventTrigger: postEventTrigger
            });
        }

        return obj.update({ 
            title: postTitle,
            type: postType,
            body: postBody,
            targetUserType: postTargetUserType,
            eventTrigger: postEventTrigger
        });
    });

    posts.insertSeed = (usecase, cb) => {
        console.log("[posts.insertSeed] Creating seed posts");
    
        const defaultPosts = require(`../../example-configs/${usecase}/posts.json`);

        const values = defaultPosts
          .map(post => {
            return "(" + [
              `'${post.code}'`,
              `'${post.type}'`,
              `'${post.title}'`,
              post.body ? `'${post.body.replace(/'/g,"''")}'` : "",
              `'${post.targetUserType}'`,
              `'${post.eventTrigger}'`,
            ].join(",") + ")";
          })
          .join(",");
    
        let sql = `INSERT INTO ${tableName} (code, type, title, body, targetUserType, eventTrigger) VALUES ${values}`;
        
        console.time("postSeedInsert");
        sequelize.query(sql, { type: sequelize.QueryTypes.INSERT })
          .then(() => cb(), cb)
          .finally(() => {
            console.timeEnd("postSeedInsert");
          });
    };

    posts.addDefaultPosts = (usecase, force, cb) => {
        const defaultPosts = require(`../../example-configs/${usecase}/posts.json`);
        const updateOrCreate = posts.createOrUpdate();

        async.eachLimit(defaultPosts, 2, (post, cb) => {
            updateOrCreate(post.code, post.type, post.title, post.body, post.targetUserType, post.eventTrigger)
            .then(() => {
                cb();
            }, cb);
        }, cb);
    };

    return posts;
};
