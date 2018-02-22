/**
 * Updates all tenant databases with the migration scripts
 * 
 * Example call:
 * VQ_DB_HOST=* VQ_DB_USER=* VQ_DB_PASSWORD=* migrations/migratedb.js 20171218222426001.sql
 */

const mysql = require("mysql2");
const async = require("async");
const cp = require("child_process");

const connConfig = {
    host: process.env.VQ_DB_HOST,
    user: process.env.VQ_DB_USER,
    password: process.env.VQ_DB_PASSWORD,
    multipleStatements: true
};

const connection = mysql.createConnection(connConfig);

connection.query("SELECT * FROM `vq-marketplace`.`tenant` WHERE status = 3", (err, tenants) => {
    if (err) {
        throw new Error(err);
    }

    tenants = tenants.filter(_ => _.tenantId);

    console.log(`Tenants found: ${tenants.length}`);

    async
    .eachLimit(tenants, 3, (tenant, cb) => {
        console.log(`Updating tenant db ${tenant.tenantId}`);

        const sqlFile = __dirname + "/" + process.argv[2];
        const cmdLine = `mysql --host=${connConfig.host} --user=${connConfig.user} --password=${connConfig.password} ${tenant.tenantId} < ${sqlFile}`;

        cp.exec(cmdLine, err => {
            cb(err);
        });
    }, err => {
        if (err) {
            throw new Error(err);
        }
        
        console.log("SUCCESS.");

        process.exit();
    });
});
