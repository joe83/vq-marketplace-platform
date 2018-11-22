import { Application } from "express";
import adminRoutes from "./routes/admin";
import appConfigRoutes from "./routes/app_config";
import appLabelRoutes from "./routes/app_label";
import appPostsRoutes from "./routes/app_post";
import appTaskCategoryRoutes from "./routes/app_task_category";
import feedRoutes from "./routes/feed";
import policyRoutes from "./routes/policy";
import uploadRoutes from "./routes/upload";
import userRoutes from "./routes/user";
import userPostRoutes from "./routes/user-post";
import userPropertyRoutes from "./routes/user-property";

export default (app: Application) => {
	app.get("/", (_, res) => res.send("VQ is up and running"));

	adminRoutes(app);
	appConfigRoutes(app);
	appLabelRoutes(app);
	appPostsRoutes(app);
	appTaskCategoryRoutes(app);
	feedRoutes(app);
	policyRoutes(app);
	userPostRoutes(app);
	userRoutes(app);
	uploadRoutes(app);
	userPropertyRoutes(app);
};

