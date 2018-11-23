const db = require("../models/models");

const runReporting = tenantId => {
    const models = db.get(tenantId);

    const analyzeEntityNo = (entityName, reportName, where) =>
        models[entityName]
        .findAndCountAll({
            where
        })
        .then(result => {
            models.report
            .upsert({
                reportName,
                reportValue: result.count
            }, {
                where: {
                    reportName
                }
            });
    });

    analyzeEntityNo("user", "# Users");
    analyzeEntityNo("userPost", "# User pots");
};

module.exports = runReporting;
