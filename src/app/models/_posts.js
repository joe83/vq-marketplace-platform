const async = require("async");
const tableName = "_posts";

const EVENT_TRIGGERS = {
    NEW_ORDER: "new-order",
    ORDER_CLOSED: "order-closed",
    ORDER_COMPLETED: "order-completed",
    ORDER_MARKED_AS_DONE: "order-marked-as-done"
}

module.exports = (sequelize, DataTypes) => {
  const posts = sequelize.define("post", {
      title: { type: DataTypes.STRING, required: true },
      code: { type: DataTypes.STRING, required: true, unique: true },
      type: { type: DataTypes.STRING, required: true },
      body: { type: DataTypes.TEXT },
      // 180221, added for emails
      targetUserType: { type: DataTypes.INTEGER, defaultValue: 0 },
      eventTrigger: {
        type: DataTypes.ENUM(
            EVENT_TRIGGERS.NEW_ORDER,
            EVENT_TRIGGERS.ORDER_CLOSED,
            EVENT_TRIGGERS.ORDER_COMPLETED,
            EVENT_TRIGGERS.ORDER_MARKED_AS_DONE,
        ),
       },
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
            });
        }

        return obj.update({ 
            title: postTitle,
            type: postType,
            body: postBody
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
