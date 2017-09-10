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

	app.get("/api/admin/request/:requestId/messages", isLoggedIn, isAdmin, (req, res) =>
		models
		.message
		.findAll({
			order: [[ 'createdAt', 'DESC' ]],
			include: [
				// { model: models.task },
				{ model: models.user, as: 'fromUser' }
			],
			where: {
				requestId: req.params.requestId
			}
		})
		.then(data => {
			return res.send(data)
		}, err => {
			return res.status(400).send(err);
		}));

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
			const userId = req.params.userId;

			models
			.user.findById(req.params.userId)
			.then(user => {
				if (!user) {
					return sendResponse(res, "NOT_FOUND");
				}

				models
				.request
				.findOne({
					where: {
						$and: [
							{
								$or: [
									{ fromUserId: userId },
									{ toUserId: userId }
								]
							}, {
								$or: [
									{ status: models.request.REQUEST_STATUS.ACCEPTED },
									{ status: models.request.REQUEST_STATUS.MARKED_DONE }
								]
							}
						]
					}
				})
				.then(outstandingRequest => {
					if (outstandingRequest) {
						return sendResponse(res, {
							code: "CANNOT_BLOCK"
						});
					}

					console.log('[ADMIN] Blocking user.');

					user.update({
						status: models.user.USER_STATUS.BLOCKED
					});

					console.log('[ADMIN] Setting active tasks of the blocked user to INACTIVE.');
					models.task.update({
						status: models.task.TASK_STATUS.INACTIVE
					}, {
						where: {
							$and: [
								{
									userId
								}, {
									$or: [
										{ 
											status: models.task.TASK_STATUS.CREATION_IN_PROGRESS
										}, { 
											status: models.task.TASK_STATUS.PENDING
										}
									]
								}
							]
						}
					})
					.then(_ => _, err => {
						console.error(err);
					});
					
					console.log('[ADMIN] Setting pending request to the blocked user to DECLINED.');
					models
					.request
					.update({
						status: models.request.REQUEST_STATUS.DECLINED
					}, {
						where: {
							$and: [
								{
									toUserId: userId
								}, {
									$or: [
										{
											status: models.request.REQUEST_STATUS.PENDING
										}
									]
								}
							]
						}
					})
					.then(_ => _, err => {
						console.error(err);
					});

					console.log('[ADMIN] Setting pending request to the blocked user to CANCELED.');
					models
					.request
					.update({
						status: models.request.REQUEST_STATUS.CANCELED
					}, {
						where: {
							$and: [
								{
									fromUserId: userId
								}, {
									$or: [
										{
											status: models.request.REQUEST_STATUS.PENDING
										}
									]
								}
							]
						}
					})
					.then(_ => _, err => {
						console.error(err);
					});
			
					sendResponse(res, null, user);

					userEmitter
						.emit('blocked', user);
					
					});
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
