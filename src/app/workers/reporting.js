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
    analyzeEntityNo("user", "# Demand Users", { userType: 1 });
    analyzeEntityNo("user", "# Supply Users", { userType: 2 });
    analyzeEntityNo("user", "# Active Users", { status: "10" });
    analyzeEntityNo("task", "# Listings");
    analyzeEntityNo("request", "# Requests");
    analyzeEntityNo("request", "# Transactions");
};

module.exports = runReporting;
