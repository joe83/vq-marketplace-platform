const db = require('../models/models');

const runReporting = tenantId => {
    const models = db.get(tenantId);

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

    analyzeEntityNo('user');
    analyzeEntityNo('task');
    analyzeEntityNo('request');
};

module.exports = runReporting;