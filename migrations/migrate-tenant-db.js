/**
 * Updates all tenant databases with the migration scripts
 * 
 * Example call:
 * VQ_DB_HOST=* VQ_DB_USER=* VQ_DB_PASSWORD=* migrations/migrate-tenant-db.js last-migration-tenant.sql
 */

const cp = require("child_process");

const connConfig = {
    host: process.env.VQ_DB_HOST,
    user: process.env.VQ_DB_USER,
    password: process.env.VQ_DB_PASSWORD,
    multipleStatements: true
};

const sqlFile = __dirname + "/" + process.argv[2];
const cmdLine = `mysql --host=${connConfig.host} --user=${connConfig.user} --password=${connConfig.password} vq-marketplace < ${sqlFile}`;

cp.exec(cmdLine, err => {
    if (err) {
        throw new Error(err);
    }

    console.log("SUCCESS.");

    process.exit();
});
