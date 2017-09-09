var responseController = require("./controllers/responseController.js");
var isEmailVerified = require("./middleware/isEmailVerified.js");
var cust = require("./config/customizing.js");

var identifyUser = responseController.identifyUser;
var isLoggedIn = responseController.isLoggedIn;

module.exports = app => {
	function pong (req, res, next) {
		responseController.sendResponse(res);
		next();
	}

	app.get('/', (req, res) =>
		res
		.send('VQ is up and running')
	);

	var getSkills = (req, res) => {
		var Skills = [
			"2D graphics",
			"3D graphics",
			"Accounting",
			"Adobe Creative Suite",
			"Adobe Flash",
			"Adobe Illustrator",
			"Adobe InDesign",
			"Adobe Photoshop",
			"Analyzing Data",
			"Android development",
			"AngularJS",
			"Angular2",
			"Audio editing",
			"Microsoft Azure",
			"Big Data",
			"Business development",
			"Business planning",
			"Business strategy",
			"C++",
			"Cash Flow Management",
			"Cassandra",
			"Cloud Computing",
			"Content Management Systems",
			"Copy editing",
			"Cordova",
			"Corporate communications",
			"CSS",
			"Design thinking",
			"Direct marketing",
			"Django",
			"Email marketing",
			"Entrepreneurship",
			"Event management",
			"ExpressJS",
			"Film editing",
			"Financial Advising",
			"Financial Concepts",
			"Financial Management",
			"General Ledger",
			"Gimp",
			"Google Analytics",
			"Graphic animation",
			"Graphic design",
			"Hadoop",
			"Hive",
			"Hybrid App Development",
			"HTML",
			"Image editing",
			"Intercultural communications",
			"Interior architecture",
			"Ionic",
			"IOS Development",
			"Java",
			"JavaScript",
			"Journalism",
			"JQuery",
			"Juniper" ,
			"Leadership",
			"Linux",
			"Logic",
			"Logo design",
			"Management",
			"Marketing",
			"Marketing strategy",
			"Market research",
			"Mathematics",
			"Meteor (JS Framework)",
			"Mobile application development",
			"MongoDB",
			"NodeJS",
			"Objective-C" ,
			"Online advertising",
			"Online marketing",
			"Oracle RAC",
			"Photography",
			"PostgreSQL",
			"Powerpoint",
			"Print design",
			"Product design",
			"Product development",
			"Product innovation",
			"Product management",
			"Project estimation",
			"Project planning",
			"Public speaking",
			"Qualitative Analysis",
			"Quantitative Analysis",
			"React",
			"RESTful Web Services",
			"Risk Management",
			"Ruby",
			"Ruby on Rails",
			"Sales",
			"Salesforce",
			"Scala",
			"Scrum master",
			"SEO",
			"Service oriented architecture",
			"Sketching",
			"Social Media",
			"Social media analytics",
			"Social media marketing",
			"Software architecture",
			"Software Development",
			"Software Engineering",
			"Software Quality Assurance (QA)",
			"Spark",
			"SQL",
			"SWOT",
			"System administration",
			"System architecture",
			"Typescript",
			"Typography",
			"UI/UX",
			"Unix",
			"Usability",
			"Video editing",
			"Wealth management",
			"Web analytics",
			"Web content writing",
			"Web Design",
			"Web Development",
			"Wordpress",
			"Writing & Editing",
		];
		res.status(200).send(Skills);
	};

	app.get('/api/skills', getSkills);
	
	// admin
	require('./routes/admin')(app);
	require('./routes/post.js')(app);

	// config
	require('./routes/app_label')(app);
	require('./routes/app_config')(app);
	require('./routes/app_task_category')(app);
	require('./routes/app_user_property')(app);

	// end-user
	require('./routes/message.js')(app);
	require('./routes/policy.js')(app);
	require('./routes/user.js')(app);
	require('./routes/user-preference.js')(app);
	require('./routes/user-property.js')(app);
	require('./routes/upload.js')(app);
	require('./routes/task.js')(app);
	require('./routes/request.js')(app);
	require('./routes/billing_address.js')(app);
	require('./routes/order.js')(app);
	require('./routes/review.js')(app);
};

