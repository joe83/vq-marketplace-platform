const stripe = require("stripe");
const configProvider = require("../app/config/configProvider");

module.exports = {
    vqStripe: stripe(configProvider().STRIPE_SECRET),
    getTenantStripe: (stripeSecret: string) => require("stripe")(stripeSecret)
};
