const responseController = require("../controllers/responseController");
const models = require('../models/models');
const isLoggedIn = responseController.isLoggedIn;
const sendResponse = responseController.sendResponse;
const RESOURCE = 'billing_address';

module.exports = app => {
    app.post(`/api/${RESOURCE}`,
        isLoggedIn,
        (req, res) => {
            const billingAddress = req.body;

            billingAddress.userId = req.user.id;

            models.billingAddress
                .create(billingAddress)
                .then(data => sendResponse(res, null, data))
                .catch(err => sendResponse(res, err));
        });

    app.get(`/api/${RESOURCE}`,
        isLoggedIn,
        (req, res) => {
            const userId = req.user.id;

            models.billingAddress.findAll({
                where: {
                    userId: userId
                }
            })
            .then(billingAddresses => 
                sendResponse(res, null, billingAddresses)
            )
            .catch(err => sendResponse(res, err));
        });
};