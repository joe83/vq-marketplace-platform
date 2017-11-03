const async = require("async");
const responseController = require("../controllers/responseController.js");
const cust = require("../config/customizing.js");
const isLoggedIn = responseController.isLoggedIn;
const identifyUser = responseController.identifyUser;


module.exports = app => {
  function pong (req, res, next) {
    responseController.sendResponse(res);
    
    next();
  }
 
  app.get("/api/user/:userId/property", identifyUser, (req, res) => {
    const userId = req.params.userId;

    async
        .waterfall([
            cb => req.models
                .userProperty
                .findAll({
                    where: { 
                        userId
                    }
                })
                .then(properties =>
                    cb(null, properties)
                , cb)
        ], (err, properties) => {
            responseController
            .sendResponse(res, err, properties);
        });
  });

  app.post("/api/user/:userId/property", isLoggedIn, (req, res) => {
    const userId = req.user.id;
    const propValue = req.body.propValue;
    const propKey = req.body.propKey;
    const property = {
        userId,
        propValue,
        propKey
    };

    var commitedProperty;

    async
        .waterfall([
            cb => req.models.userProperty.findOne({
                where: {
                    $and: [
                        { userId },
                        { propKey: property.propKey }
                    ]
                    
                }
            })
            .then(prop => cb(null, prop), cb),
            (prop, cb) => {
                if (prop) {
                    return prop
                        .update({
                            propValue
                        })
                        .then(updatedProperty => {
                            commitedProperty = prop;
                            
                            return cb();
                        }, cb);
                }

                return req.models
                    .userProperty
                    .create(property)
                    .then(newProperty => {
                        commitedProperty = newProperty;

                        return cb();
                    }, cb);
            }
        ], err => {
            responseController
            .sendResponse(res, err, commitedProperty);
        });
  });
};
