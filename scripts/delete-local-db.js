require('dotenv').config();

/**
 * Deletes vq-test tenant datascheme and vq-marketplace master datascheme in local db.
 */

const cp = require("child_process");

const LOCAL_VQ_USER_NAME = process.env.VQ_DB_USER;
const LOCAL_VQ_DB_PASSWORD = process.env.VQ_DB_PASSWORD;

// deletes the vq-marketplace and  database
const cmdLineMain = `mysql --user=${LOCAL_VQ_USER_NAME} --password=${LOCAL_VQ_DB_PASSWORD} < ${__dirname}/delete-local-db.sql`;

const run = cb => {

    if (process.env.ENV.toLowerCase() === 'production') {
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
