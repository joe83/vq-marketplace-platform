const stripe = require("stripe");

module.exports = {
    vqStripe: stripe(process.env.STRIPE_SECRET),
    getTenantStripe: (stripeSecret: string) => require("stripe")(stripeSecret)
};
