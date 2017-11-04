const responseController = require("../controllers/responseController.js");
const cust = require("../config/customizing.js");

const identifyUser = responseController.identifyUser;
const isLoggedIn = responseController.isLoggedIn;
const sendResponse = responseController.sendResponse;

module.exports = app => {
  function pong (req, res, next) {
    sendResponse(res);
    
    next();
  }

  app.get("/api/me", isLoggedIn, (req, res) => {
      return sendResponse(res, null, req.user);
  });

  app.get("/api/user/:userId", isLoggedIn, (req, res) => {
    req.models.user.findOne({ 
      where:
        { 
          id: req.params.userId 
        },
        include: [
          { model: req.models.userProperty },
          { model: req.models.userPreference }
        ]
    })
    .then(
      user => {
        user = JSON.parse(JSON.stringify(user));

        if (!req.user.isAdmin && req.query.adminView) {
          user.userProperties.forEach(_ => {
              const prop = _;
    
              prop.propValue = Boolean(prop.propValue);
          });
        }

        return sendResponse(res, null, user);
      }, 
      err => sendResponse(res, err)
    );
  });

  app.put("/api/user/:userId", isLoggedIn, (req, res) => {
    const mutableFields = [
      "firstName",
      "lastName",
      "bio",
      "website",
      "imageUrl"
    ];
    
    const updateObj = {};

    try {
      Object
      .keys(req.body)
      .filter(_ => mutableFields.indexOf(_) !== -1)
      .forEach(fieldKey => {
        updateObj[fieldKey] = req.body[fieldKey];
      });
    } catch(err) {
      return sendResponse(res, err);
    }

    req.models.user
      .update(updateObj, {
          where: {
              id: req.params.userId
          }
      })
      .then(
        data => sendResponse(res, null, data), 
        err => sendResponse(res, err)
      );
  });

  /**
   * Deactivates user account
   */
  app.delete("/api/user/:userId", isLoggedIn, (req, res) => {
      req.models.user.destroy({
            where: {
                id: req.user.id
            }
      })
      .then(
        _ => {
          return sendResponse(res, null, {});
        }, 
        err => sendResponse(res, err)
      );
  });
};
