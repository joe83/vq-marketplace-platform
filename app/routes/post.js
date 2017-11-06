const resCtrl = require("../controllers/responseController.js");
const isLoggedIn = resCtrl.isLoggedIn;
const isAdmin = resCtrl.isAdmin;

module.exports = app => {
	app.get("/api/post", /* isLoggedIn, isAdmin, */ (req, res) => req.models.post
		.findAll({
            where: req.query
        })
		.then(data => res.send(data)));

	app.get("/api/post/:code/code", /* isLoggedIn, isAdmin, */ (req, res) => req.models.post
		.findOne({ 
            where: {
                code: req.params.code
            }
        })
		.then(data => data ? res.send(data) : res.status(404).send(data)));

    app.get("/api/post/:postId/id", /* isLoggedIn, isAdmin, */ (req, res) => req.models.post
		.findById(req.params.postId)
		.then(data => data ? res.send(data) : res.status(404).send(data)));

    app.post("/api/post", isLoggedIn, isAdmin, (req, res) => req.models.post
        .create(req.body)
		.then(data => res.send(data)));

    app.put("/api/post/:postId", isLoggedIn, isAdmin, (req, res) => req.models.post
        .update({ 
            title: req.body.title,
            body: req.body.body
        }, {
            where: {
                id: req.params.postId
            }
        })
        .then(data => res.send(data), err => res.status(500).send(err))
    );
};
