/**
 * Deletes dataschemes in local db. Can only work in development env.
 */

require('dotenv').config();

const cp = require("child_process");

const LOCAL_VQ_USER_NAME = process.env.VQ_DB_USER;
const LOCAL_VQ_DB_PASSWORD = process.env.VQ_DB_PASSWORD;

const script = [
    "DROP DATABASE IF EXISTS `vq-marketplace`;",
    "DROP DATABASE IF EXISTS `mytestmarketplace`;",
    "DROP DATABASE IF EXISTS `test`;",
    "DROP DATABASE IF EXISTS `test-signup`;",
    "DROP DATABASE IF EXISTS `test-signupscheme`;"
];

const run = (database, cb) => {
    let dbDeleteScript = database ? [ "DROP DATABASE IF EXISTS `" + database + "`;"] : [];

    dbDeleteScript = dbDeleteScript.concat(script).join("");

    // deletes the vq-marketplace and  database
    const cmdLineMain = `echo $'${dbDeleteScript}' > ${__dirname}/delete-local-db.sql && mysql --host=${process.env.VQ_DB_HOST} --user=${LOCAL_VQ_USER_NAME} --password=${LOCAL_VQ_DB_PASSWORD} < ${__dirname}/delete-local-db.sql`;

    if (process.env.ENV.toLowerCase() === "production") {
        throw new Error("Cannot run in production mode");
    }

    cp.exec(cmdLineMain, err => {
        if (err) {
            throw new Error(err);
        }

        cb();
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
