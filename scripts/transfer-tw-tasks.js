const async = require('async');
const db = require('../built/app/models/models.js');
const MongoClient = require('mongodb').MongoClient
var BSON = require('bson');

MongoClient.connect(process.env.ST_MONGODB, function(err, mongoDb) {
    const users = mongoDb.collection("users");

    db.create("vq", () => {
        db.get("vq")
        .seq.query("SELECT * FROM task")
        .then(res => {
            
            const tasks = res[0]
            console.log(tasks.length + "  has been found");

            
            async.eachSeries(tasks, (task, cb) => {
                users.findOne({_id: BSON.ObjectID(task.ownerUserId)})
                .then(user => {
                    console.log(user);
                    
                    db.get("vq").user.findOne({
                        where: {
                            $and: [
                                { firstName: user.profile.firstName },
                                { lastName: user.profile.lastName }
                            ]
                        }
                    }).then(vqUser => {
                        vqUser

                        db.get("vq").task.update({
                            userId: vqUser.id
                        }, {
                            where: {
                                id: task.id
                            }
                        }).then(_ => {
                            cb();
                        })
                    });

                })
            }, () => {
                process.exit();
            });
            
      
            
        });
    })
});
