const stripe = require("stripe")("sk_test_Hops88AqZwLgedHPbzyiTXps");
const responseController = require("../controllers/responseController.js");
const isLoggedIn = responseController.isLoggedIn;

module.exports = app => {
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