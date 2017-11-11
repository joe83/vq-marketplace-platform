const stripe = require("stripe")("sk_test_YBNHjAXJ2I1fKOrQaLTdP0e4");
const responseController = require("../controllers/responseController.js");
const isLoggedIn = responseController.isLoggedIn;
const isAdmin = responseController.isAdmin;

const tenantDb = require("../../app-tenant/models");

const createAccount = (type, country, email, cb) => {
    stripe.accounts.create({
        type,
        country,
        email,
   })
   .then(rAccount => {
       console.log(rAccount);

       cb(null, rAccount);
   }, err => {
       console.log(err);

       cb(err);
   });
};

module.exports = app => {
    /**
     * Creates an account for the marketplace
     * Stripe is the only one supported payment provider at a time
     */
    app.post("/api/payment/account", isLoggedIn, isAdmin, (req, res) => {
        const tenantModels = tenantDb.get();

        tenantModels
        .tenant
        .findOne({
            tenantId: req.models.tenantId
        })
        .then(rTenant => {
            createAccount("standard", rTenant.country, rTenant.email, (err, rAccount) => {
                if (err) {
                    return res.status(400).send(err);
                }

                return res.send(rAccount);
            });
        });
    });
};