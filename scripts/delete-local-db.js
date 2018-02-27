/**
 * Deletes all dataschemes in local db.
 */

const cp = require("child_process");

const LOCAL_VQ_USER_NAME = process.env.LOCAL_VQ_DB_USER || "root";
const LOCAL_VQ_DB_PASSWORD = process.env.LOCAL_VQ_DB_PASSWORD || "kurwa";

// deletes the vq-marketplace database
const cmdLineMain = `mysql --user=${LOCAL_VQ_USER_NAME} --password=${LOCAL_VQ_DB_PASSWORD} < ${__dirname}/delete-local-db.sql`;

// deletes all databases
const cmdLine =  `mysql -u${LOCAL_VQ_USER_NAME} -p${LOCAL_VQ_DB_PASSWORD} -e "show databases" | grep -v Database | grep -v mysql| grep -v information_schema| gawk '{print "drop database " $1 ";"}' | mysql -u${LOCAL_VQ_USER_NAME} -p${LOCAL_VQ_DB_PASSWORD}`;

const run = cb => {
    console.log(cmdLine);

    if (process.env.PRODUCTION) {
        throw new Error("Cannot run in production mode");
    }

    cp.exec(cmdLineMain, err => {
        if (err) {
            throw new Error(err);
        }
    
        cp.exec(cmdLine, err => {
            if (err) {
                throw new Error(err);
            }
        
            cb();
        });
    });
};


if (!module.parent) {
    run(() => {
        process.exit();
    });
} else {
    module.exports = {
        run
    };
}
