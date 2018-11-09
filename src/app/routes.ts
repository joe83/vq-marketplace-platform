import { Application } from "express";

import adminRoutes from "./routes/admin";
import appConfigRoutes from "./routes/app_config";
import appLabelRoutes from "./routes/app_label";
import appTaskCategoryRoutes from "./routes/app_task_category";
import policyRoutes from "./routes/policy";
import uploadRoutes from "./routes/upload";
import userRoutes from "./routes/user";
import userPropertyRoutes from "./routes/user-property";

export default (app: Application) => {
	app.get("/", (req, res) =>
		res
		.send("VQ is up and running")
	);

	// admin
	/**
		require("./routes/admin")(app);
		require("./routes/post.js")(app);
	*/

	/**
		require("./routes/app_label")(app);
		require("./routes/app_config")(app);
		require("./routes/app_task_category")(app);
		require("./routes/app_user_property")(app);
	*/

	/**
	 * Authentification module
	 */

  	adminRoutes(app);
	appConfigRoutes(app);
	appLabelRoutes(app);
	appTaskCategoryRoutes(app);
	policyRoutes(app);
	userRoutes(app);
	uploadRoutes(app);
	/**
	 * User custom properties module
	 */
	userPropertyRoutes(app);

	/**
	 * OBSOLETE! @TODO
	require("./routes/message")(app);
	require("./routes/payment")(app);
	require("./routes/user-preference")(app);
	
	require("./routes/task")(app);
	require("./routes/request")(app);
	require("./routes/billing_address")(app);
	require("./routes/order")(app);
	require("./routes/review")(app);
	require("./routes/vq-services")(app);
	 */
};
