const resCtrl = require("../controllers/responseController.js");
const cust = require("../config/customizing.js");
const isLoggedIn = resCtrl.isLoggedIn;
const isAdmin = resCtrl.isAdmin;
const sendResponse = resCtrl.sendResponse;
const models  = require('../models/models');

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
		.findAll({})
		.then(data => res.send(data)));

	app.put("/api/admin/user/:userId/block", 
		isLoggedIn,
		isAdmin,
		(req, res) => {
			models.user
            .update({
                status: 20
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
	
	app.put("/api/admin/user/:userId/unblock", 
		isLoggedIn,
		isAdmin,
		(req, res) => {
			models.user
            .update({
                status: 10
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
