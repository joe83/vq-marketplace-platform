const async = require('async');
const responseController = require("../controllers/responseController.js");
const cust = require("../config/customizing.js");
const isLoggedIn = responseController.isLoggedIn;
const models = require("../models/models.js");

module.exports = app => {
  function pong (req, res, next) {
    responseController.sendResponse(res);
    
    next();
  }
 
  app.get('/api/user/:userId/property', (req, res) => {
    const userId = req.params.userId;

    async
        .waterfall([
            cb => models
                .userProperty
                .findAll({
                    where: { 
                        userId,
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

  app.post('/api/user/:userId/property', isLoggedIn, (req, res) => {
    const propValue = req.body.propValue;
    const propKey = req.body.propKey;
    const property = {
        userId: req.user.id,
        propValue,
        propKey
    };

    var commitedProperty;

    async
        .waterfall([
            cb => models.userProperty.findOne({
                where: { 
                    userId: req.params.userId,
                    propKey: req.params.propKey
                }
            })
            .then(prop => cb(null, prop), cb),
            (prop, cb) => {
                if (prop) {
                    return models
                        .userProperty
                        .update({
                            propValue 
                        }, {
                            where: { 
                                userId: req.params.userId,
                                propKey: req.params.propKey,
                                propValue
                            }
                        })
                        .then(updatedProperty => {
                            commitedProperty = updatedProperty;
                            
                            return cb();
                        }, cb);
                }

                return models
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
