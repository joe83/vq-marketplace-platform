const responseController = require("./controllers/responseController.js");

module.exports = app => {
	function pong (req, res, next) {
		responseController.sendResponse(res);
		next();
	}

	app.get("/", (req, res) =>
		res
		.send("VQ is up and running")
	);

	// admin
	require("./routes/admin")(app);
	require("./routes/post.js")(app);

	// config
	require("./routes/app_label")(app);
	require("./routes/app_config")(app);
	require("./routes/app_task_category")(app);
	require("./routes/app_user_property")(app);

	// end-user
	require("./routes/message.js")(app);
	require("./routes/policy.js")(app);
	require("./routes/payment.ts")(app);
	require("./routes/user.js")(app);
	require("./routes/user-preference.js")(app);
	require("./routes/user-property.js")(app);
	require("./routes/upload.js")(app);
	require("./routes/task.js")(app);
	require("./routes/request.js")(app);
	require("./routes/billing_address.js")(app);
	require("./routes/order.js")(app);
	require("./routes/review.js")(app);
	require("./routes/vq-services.js")(app);
};
