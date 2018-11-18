require('dotenv').config();

const db = require('../src/app/models/models.js');
const async = require('async');
const tenantServices = require("../build/app-tenant/service");

const USECASE = process.argv[2];
const TENANT_ID = process.argv[3] || process.env.TENANT_ID;
const TARGET_LANG = process.argv[4] || "en";

if (!USECASE) {
    throw new Error('Specify USECASE');
}

db.create(TENANT_ID, USECASE, () => {
    console.log('Database created for ' + USECASE + ' marketplace for tenant ' + TENANT_ID);

    async.parallel([
        (cb) => {
            db.get(TENANT_ID)
            .appConfig
            .addDefaultConfig(USECASE, (err) => {
                if (err) {
                    console.log(err);

                    return cb(err);
                }

                console.log('Configs restored for ' + USECASE + ' marketplace for tenant ' + TENANT_ID);

                cb();
            });
        },
        (cb) => {
            db.get(TENANT_ID)
            .appLabel
            .addDefaultLangLabels(TARGET_LANG, USECASE, true, (err) => {
                if (err) {
                    console.log(err);

                    return cb(err);
                }
                console.log('Labels restored for ' + USECASE + ' marketplace for tenant ' + TENANT_ID);

                cb();
            });
        },
        (cb) => {
    
            db.get(TENANT_ID)
            .post
            .addDefaultPosts(USECASE, true, (err) => {
                if (err) {
                    console.log(err);
                    
                    return cb(err);
                }

                console.log('Posts restored for ' + USECASE + ' marketplace for tenant ' + TENANT_ID);

                return cb();
            });  
        }
    ], (err) => {
        if (err) {
            console.error("Error!", err);

            return process.exit();
        }

        console.error("New marketplace has been successfully created / updated!");

        return process.exit();
    });
});
