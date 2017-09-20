const resCtrl = require("../controllers/responseController.js");
const cust = require("../config/customizing.js");
const isLoggedIn = resCtrl.isLoggedIn;
const isAdmin = resCtrl.isAdmin;
const models  = require('../models/models');

module.exports = app => {
	app.get("/api/post", /* isLoggedIn, isAdmin, */ (req, res) => models.post
		.findAll({
            where: req.query
        })
		.then(data => res.send(data)));

	app.get("/api/post/:code/code", /* isLoggedIn, isAdmin, */ (req, res) => models.post
		.findOne({ 
            where: {
                code: req.params.code
            }
        })
		.then(data => res.send(data)));

    app.get("/api/post/:postId/id", /* isLoggedIn, isAdmin, */ (req, res) => models.post
		.findById(req.params.postId)
		.then(data => res.send(data)));

    app.post("/api/post", isLoggedIn, isAdmin, (req, res) => models.post
        .create(req.body)
		.then(data => res.send(data)));

    app.put("/api/post/:postId", isLoggedIn, isAdmin, (req, res) => models.post
        .update({ 
            title: req.body.title,
            body: req.body.body
        }, {
            where: {
                id: req.params.postId
            }
        })
    );
};
