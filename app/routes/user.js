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
        },
        include: [
          { model: models.userProperty },
          { model: models.userPreference }
        ]
    })
    .then(
      user => {
        user = JSON.parse(JSON.stringify(user));
        user.userProperties.forEach(_ => {

          const prop = _;

          prop.propValue = Boolean(prop.propValue);
        });

        return responseController.sendResponse(res, null, user)
      }, 
      err => responseController.sendResponse(res, err)
    );
  });

  app.put('/api/user/:userId', isLoggedIn, (req, res) => {
    const mutableFields = [
      'firstName',
      'lastName',
      'bio',
      'website',
      'imageUrl'
    ];
    
    const updateObj = {};

    try {
      Object
      .keys(req.body)
      .filter(_ => mutableFields.indexOf(_) !== -1)
      .forEach(fieldKey => {
        updateObj[fieldKey] = req.body[fieldKey];
      })
    } catch(err) {
      return responseController.sendResponse(res, err)
    }

    models.user
      .update(updateObj, {
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