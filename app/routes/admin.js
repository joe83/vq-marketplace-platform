const resCtrl = require("../controllers/responseController.js");
const async = require("async");
const cust = require("../config/customizing.js");
const vqAuth = require("../auth");
const isLoggedIn = resCtrl.isLoggedIn;
const isAdmin = resCtrl.isAdmin;
const sendResponse = resCtrl.sendResponse;
const db = require('../models/models');
const requestCtrl = require("../controllers/requestCtrl");
const userEmitter = require("../events/user");
const taskEmitter = require("../events/task");

module.exports = app => {
	app.get("/api/admin/report", isLoggedIn, isAdmin, (req, res) => req.models.report
		.findAll({
			distinct: 'reportName',
			order: [[ 'createdAt', 'DESC' ]]
		})
		.then(data => res.send(data)));

	app.get("/api/admin/user", isLoggedIn, isAdmin, (req, res) => req.models.user
		.findAll({
			order: [[ 'createdAt', 'DESC' ]],
			include: [
				{ model: req.models.userProperty },
				{ model: req.models.userPreference }
			]
		})
		.then(data => res.send(data), err => {
			console.error(err);

			res.status(400).send(err);
		}));

	app.get("/api/admin/user/:userId/emails", (req, res) => {
		const userId = req.params.userId;

		req.models
			.user
			.findById(userId)
			.then(user => {
				if (!user) {
					return res.status(404).send("NOT_FOUND");
				}

				vqAuth
					.getEmailsFromUserId(req.models, user.vqUserId, (err, rUserEmails) => {
						if (err) {
							return res.status(400).send(err);
						}
			
						const emails = rUserEmails
							.map(_ => _.email);
			
						res.status(200).send(emails);
					});
			}, err => res.status(500).send(err));
	})

	app.get("/api/admin/request", isLoggedIn, isAdmin, (req, res) => req.models.request
		.findAll({
			order: [[ 'createdAt', 'DESC' ]],
			include: [
				{ model: req.models.task },
				{ model: req.models.user, as: 'fromUser' }
			]
		})
		.then(data => res.send(data)));

	app.get("/api/admin/request/:requestId/messages", isLoggedIn, isAdmin, (req, res) =>
		req.models
		.message
		.findAll({
			order: [[ 'createdAt', 'DESC' ]],
			include: [
				// { model: req.models.task },
				{ model: req.models.user, as: 'fromUser' }
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

	app.get("/api/admin/task", isLoggedIn, isAdmin, (req, res) => req.models.task
		.findAll({
			order: [[ 'createdAt', 'DESC' ]],
			include: []
		})
		.then(data => res.send(data)));

	app.put("/api/admin/task/:taskId/spam", 
		isLoggedIn,
		isAdmin,
		(req, res) => {
			req.models
			.task
			.findById(req.params.taskId)
			.then(
				task => {
					if (!task) {
						return sendResponse(res, 'NOT_FOUND');
					}
					
					if (task.status !== req.models.task.TASK_STATUS.ACTIVE) {
						return sendResponse(res, {
							code: 'TASK_IS_NOT_ACTIVE'
						});
					}

					task
						.update({
							status: req.models.task.TASK_STATUS.SPAM
						});

					taskEmitter
						.emit('marked-spam', req.models, task);

					task.getRequests()
					.then(requests => {
						requests.forEach(request => {
							requestCtrl
							.declineRequest(req.models, request.id, err => console.error(err));
						});

						sendResponse(res, null, task);
					}, err => console.error(err));
				}, 
				err => sendResponse(res, err)
			);
		});

	app.delete("/api/admin/user/:userId/verifications", 
		isLoggedIn,
		isAdmin,
		(req, res) => {
			req.models
			.userProperty
			.destroy({
				where: {
					$and: [
						{ userId: req.params.userId },
						{
							$or: [
								{ propKey: 'studentIdUrl' },
								{ propKey:  'studentIdBackUrl' }
							]
						}
					]
				}
			})
			.then(
				() => {
					sendResponse(res, null, { ok: 200 })
				}, 
				err => sendResponse(res, err)
			);
		});

	app.get("/api/admin/order", isLoggedIn, isAdmin, (req, res) => req.models.request
		.findAll({
			order: [[ 'createdAt', 'DESC' ]],
			include: [
				{ model: req.models.task }
			]
		})
		.then(data => res.send(data)));

	app.put("/api/admin/user/:userId/block", 
		isLoggedIn,
		isAdmin,
		(req, res) => {
			const userId = req.params.userId;

			req.models
			.user.findById(req.params.userId)
			.then(user => {
				if (!user) {
					return sendResponse(res, "NOT_FOUND");
				}

				req.models
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
									{ status: req.models.request.REQUEST_STATUS.ACCEPTED },
									{ status: req.models.request.REQUEST_STATUS.MARKED_DONE }
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
						status: req.models.user.USER_STATUS.BLOCKED
					});

					console.log('[ADMIN] Setting active tasks of the blocked user to INACTIVE.');
					req.models.task.findAll({
						where: {
							$and: [
								{
									userId
								}, {
									$or: [
										{ 
											status: req.models.task.TASK_STATUS.CREATION_IN_PROGRESS
										}, { 
											status: req.models.task.TASK_STATUS.ACTIVE
										}
									]
								}
							]
						}
					})
					.then(activeTasks => {
						async.eachSeries(activeTasks, (activeTask, cb) => {
							activeTask.update({
								status: req.models.task.TASK_STATUS.INACTIVE
							})
							.then(_ => {
								requestCtrl
								.declineAllPendingRequestsForTask(req.models, activeTask.id, err => {
									if (err) {
										return cb(err);
									}
				
									console.log(`[SUCCESS] All pending requests for task ${activeTask.id} have been declined!`);

									cb();
								});
							}, cb);
						}, err => {
							if (err) {
								return console.error(err);
							}
						})
					});
					
					console.log('[ADMIN] Setting pending request to the blocked user to DECLINED.');
					req.models
					.request
					.update({
						status: req.models.request.REQUEST_STATUS.DECLINED
					}, {
						where: {
							$and: [
								{
									toUserId: userId
								}, {
									$or: [
										{
											status: req.models.request.REQUEST_STATUS.PENDING
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
					req.models
					.request
					.update({
						status: req.models.request.REQUEST_STATUS.CANCELED
					}, {
						where: {
							$and: [
								{
									fromUserId: userId
								}, {
									$or: [
										{
											status: req.models.request.REQUEST_STATUS.PENDING
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
						.emit('blocked', req.models, user);
					
					});
			}, err => sendResponse(res, err));
		});
	
	app.put("/api/admin/user/:userId/unblock", 
		isLoggedIn,
		isAdmin,
		(req, res) => {
			req.models.user
            .update({
                status: req.models.user.USER_STATUS.VERIFIED
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
