var responseController = require("../controllers/responseController.js");
var cust = require("../config/customizing.js");

var identifyUser = responseController.identifyUser;
var isLoggedIn = responseController.isLoggedIn;

var models = require("../models/models.js");

module.exports = app => {
  function pong (req, res, next) {
    responseController.sendResponse(res);
    
    next();
  }

  app.get('/api/me', isLoggedIn, (req, res) => {
      return responseController.sendResponse(res, null, req.user);
  });

  app.get('/api/user/:userId', (req, res) => {
    models.user.findOne({ 
      where:
        { 
          id: req.params.userId 
        }
    })
    .then(
      data => responseController.sendResponse(res, null, data), 
      err => responseController.sendResponse(res, err)
    );
  });

  app.get('/api/user/:userId/:propType', (req, res) => {
    models.userProperty.findAll({
      where: { 
          userId: req.params.userId,
          propType: req.params.propType
      }
    })
    .then(
      data => responseController.sendResponse(res, null, data), 
      err => responseController.sendResponse(res, err)
    );
  });

  app.put('/api/user/:userId', isLoggedIn, (req, res) => {
    models.user
      .update({ 
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          bio: req.body.bio,
          website: req.body.website
      }, {
          where: {
              id: req.params.userId
          }
      })
      .then(
        data => responseController.sendResponse(res, null, data), 
        err => responseController.sendResponse(res, err)
      );
  });
};