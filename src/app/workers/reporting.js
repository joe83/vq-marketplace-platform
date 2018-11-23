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
    analyzeEntityNo("userPost", "# Published posts", { status: "published" });
    analyzeEntityNo("userPost", "# draft posts", { status: "draft" });
};

module.exports = runReporting;
