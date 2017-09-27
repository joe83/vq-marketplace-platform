const marketplaceConfig = require('vq-marketplace-config');

module.exports = (sequelize, DataTypes) => {
  const posts = sequelize.define("post", {
      title: { type: DataTypes.STRING, required: true },
      code: { type: DataTypes.STRING, required: true, unique: true },
      type: { type: DataTypes.STRING, required: true },
      body: { type: DataTypes.TEXT }
  }, {
      tableName: '_posts',
      classMethods: {
        associate: models => {}
      }
  });


  posts.createOrUpdate = () => (postCode, postType, postTitle, postBody) => posts
    .findOne({ where: { code: postCode } })
    .then(obj => {
        if (!obj) {
            return posts.create({ 
                code: postCode,
                title: postTitle,
                type: postType,
                body: postBody
            });
        }

        return posts.update({ 
            title: postTitle,
            type: postType,
            body: postBody
        }, {
            where: {
                id: obj.id
            }
        });
    });

  posts.addDefaultPosts = (usecase, force) => {
    const defaultPosts = marketplaceConfig[usecase].posts();
    const updateOrCreate = posts.createOrUpdate();

    defaultPosts
    .forEach(defaultPost => {
        updateOrCreate(defaultPost.code, defaultPost.type, defaultPost.title, defaultPost.body);
    });
  };  

  return posts;
};
