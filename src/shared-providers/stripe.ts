const configProvider = require("../app/config/configProvider");

module.exports = require("stripe")(configProvider().STRIPE_SECRET);
