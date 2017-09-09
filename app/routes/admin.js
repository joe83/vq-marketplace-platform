const resCtrl = require("../controllers/responseController.js");
const cust = require("../config/customizing.js");
const vqAuth = require("../config/vqAuthProvider");
const isLoggedIn = resCtrl.isLoggedIn;
const isAdmin = resCtrl.isAdmin;
const sendResponse = resCtrl.sendResponse;
const models  = require('../models/models');
const requestCtrl = require("../controllers/requestCtrl");
const userEmitter = require("../events/user");
const taskEmitter = require("../events/task");

const analyzeEntityNo = entityName =>
	models[entityName].findAndCountAll({})
	.then(result => {
		models.report.upsert({
			reportName: `${entityName}No`,
			reportValue: result.count
		}, {
			where: {
				reportName: `${entityName}No`
			}
		});
	});

const prepareReports = () => {
	analyzeEntityNo('user');
	analyzeEntityNo('task');
	analyzeEntityNo('request');
};

setInterval(() => {
	prepareReports();
}, 36000);

setTimeout(() => prepareReports(), 5000);

module.exports = app => {
	app.get("/api/admin/report", isLoggedIn, isAdmin, (req, res) => models.report
		.findAll({
			distinct: 'reportName',
			order: [[ 'createdAt', 'DESC' ]]
		})
		.then(data => res.send(data)));

	app.get("/api/admin/user", isLoggedIn, isAdmin, (req, res) => models.user
		.findAll({
			order: '"createdAt" DESC',
			include: [
				{ model: models.userProperty },
				{ model: models.userPreference }
			]
		})
		.then(data => res.send(data)));

	app.get("/api/admin/user/:userId/emails", (req, res) => {
		const userId = req.params.userId;

		models
			.user
			.findById(userId)
			.then(user => {
				if (!user) {
					return res.status(404).send("NOT_FOUND");
				}

				vqAuth
					.getEmailsFromUserId(user.vqUserId, (err, rUserEmails) => {
						if (err) {
							return cb(err);
						}
			
						emails = rUserEmails
							.map(_ => _.email);
			
						res.status(200).send(emails);
					});
			}, err => res.status(500).send(err));
	})

	app.get("/api/admin/request", isLoggedIn, isAdmin, (req, res) => models.request
		.findAll({
			order: [[ 'createdAt', 'DESC' ]],
			include: [
				{ model: models.task },
				{ model: models.user, as: 'fromUser' }
			]
		})
		.then(data => res.send(data)));

	app.get("/api/admin/task", isLoggedIn, isAdmin, (req, res) => models.task
		.findAll({
			order: [[ 'createdAt', 'DESC' ]],
			include: []
		})
		.then(data => res.send(data)));

		app.put("/api/admin/task/:taskId/spam", 
			isLoggedIn,
			isAdmin,
			(req, res) => {
				models
				.task
				.findById(req.params.taskId)
				.then(
					task => {
						if (!task) {
							return sendResponse(res, 'NOT_FOUND');
						}
						
						task
							.update({
								status: models.task.TASK_STATUS.SPAM
							});

						sendResponse(res, null, task);

						taskEmitter
							.emit('marked-spam', task);

						task.getRequests()
						.then(requests => {
							requests.forEach(request => {
								requestCtrl
								.declineRequest(request.id, err => console.error(err));
							});
						}, err => console.error(err));
					}, 
					err => sendResponse(res, err)
				);
			});

	app.get("/api/admin/order", isLoggedIn, isAdmin, (req, res) => models.request
		.findAll({
			order: '"createdAt" DESC',
			include: [
				{ model: models.task }
			]
		})
		.then(data => res.send(data)));

	app.put("/api/admin/user/:userId/block", 
		isLoggedIn,
		isAdmin,
		(req, res) => {
			models
			.user.findById(req.params.userId)
			.then(user => {
				if (!user) {
					return sendResponse(res, "NOT_FOUND");
				}

				user.update({
					status: models.user.USER_STATUS.BLOCKED
				});

				sendResponse(res, null, user);

				userEmitter.emit('blocked', user);
			}, err => sendResponse(res, err));
		});
	
	app.put("/api/admin/user/:userId/unblock", 
		isLoggedIn,
		isAdmin,
		(req, res) => {
			models.user
            .update({
                status: models.user.USER_STATUS.VERIFIED
            }, {
                where: {
                    id: req.params.userId
                }
            })
            .then(
                data => sendResponse(res, null, data), 
                err => sendResponse(res, err)
            );
		});
};
