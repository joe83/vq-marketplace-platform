const Listly = require("listly");
const config = require("../config/configProvider.js")();

module.exports = {
    addToNewsletter : addToNewsletter
};

function addToNewsletter(email) {
        const listId = config.production ? 3 : 99;

		Listly.appendToList(listId, email, {}, err => {
			if (err) {
				console.error(err);
			} else {
				console.log("[SUCCESS] [NewsletterService] %s added to Listly",email);
			}
		});
}