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

// createAccount("standard", "hu", "adrianbarwicki+2@gmail.com");

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

    app.post("/api/payment/sub", isLoggedIn, (req, res) => {
        var customer = {};
        var User = req.user;

        if (User.stripe && User.stripe.subId) {
            return res.status(400).send("Already on subscription");
        }

        stripe.customers.create({
            email: req.body.email
        }).then(rCustomer => {
            customer = rCustomer;

            return stripe.customers.createSource(customer.id, {
                source: {
                    object: "card",
                    exp_month: req.body.exp_month,
                    exp_year: req.body.exp_year,
                    number: req.body.number,
                    cvc: req.body.cvc,
                }
            });
        }).then(source => {
            console.log(source);
            return stripe.subscriptions.create({
                customer: customer.id,
                plan:"premium-1"
            });
        }).then(subsription => {

            User.paymentProfile.firstName = req.body.firstName;
            User.paymentProfile.lastName = req.body.lastName;
            User.paymentProfile.company = req.body.company;

            User.stripe = {};
            User.stripe.customerId = customer.id;
            User.stripe.subId = subsription.id;

            User.save().then(() => res.send({substriptionId: subsription.id }));
        }).catch(err => {
            return res.status(500).send(err);
        });
    });
};