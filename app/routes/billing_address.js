const responseController = require("../controllers/responseController");
const isLoggedIn = responseController.isLoggedIn;
const sendResponse = responseController.sendResponse;
const RESOURCE = "billing_address";

module.exports = app => {
    app.post(`/api/${RESOURCE}`,
        isLoggedIn,
        (req, res) => {
            const userId = req.user.id;
            const billingAddress = req.body;

            billingAddress.userId = userId;

            req.models
            .billingAddress
            .findOne({
                where: {
                    $and: [
                        { userId },
                        { default: true }
                    ]
                }
            })
            .then(defaultBillingAddress => {
                if (!defaultBillingAddress) {
                    billingAddress.default = true;
                }

                return req.models
                    .billingAddress
                    .create(billingAddress)
                    .then(data => sendResponse(res, null, data));
            }, err => sendResponse(res, err));
        });
    
    app.put(`/api/${RESOURCE}/:${RESOURCE}_id`,
        isLoggedIn,
        (req, res) => {
            const userId = req.user.id;
            const billingAddressId = req.params.billing_address_id;
            const billingAddress = req.body;

            billingAddress.userId = userId;

            req.models
            .billingAddress
            .findOne({
                where: {
                    $and: [
                        { id: billingAddressId },
                        { userId }
                    ]
                }
            })
            .then(rBillingAddress => {
                delete billingAddress.userId;
                delete billingAddress.id;
                delete billingAddress.createdAt;
                delete billingAddress.updatedAt;

                rBillingAddress
                .update(billingAddress)
                .then(
                    data => sendResponse(res, null, data),
                    err => sendResponse(res, err)
                );
            }, err => sendResponse(res, err));
        });

    app.get(`/api/${RESOURCE}`,
        isLoggedIn,
        (req, res) => {
            const userId = req.user.id;

            const andCondition = [
                { userId }
            ];

            if (req.query.default) {
                andCondition.push({ default: true });
            }

            req.models.billingAddress.findAll({
                where: {
                    $and: andCondition
                }
            })
            .then(billingAddresses => 
                sendResponse(res, null, billingAddresses)
            )
            .catch(err => sendResponse(res, err));
        });
};