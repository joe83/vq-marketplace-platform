const EventEmitter = require("events");
const async = require("async");
const emailService = require("../services/emailService");
const randomstring = require("randomstring");
const config = require("../config/configProvider.js")();
const vqAuth = require("../auth");

class DefaultEmitter extends EventEmitter {}
const taskEmitter = new DefaultEmitter();

const getDomainName = (models, cb) => {
    models
    .appConfig
    .findOne({
        where: {
            fieldKey: "DOMAIN"
        }
    })
    .then(configField => {
        configField = configField || {};
        
        const domain = configField.fieldValue || "http://localhost:3000";

        return cb(null, domain);
    }, cb);
};

const handlerFactory = (emailCode) => (models, task) => {
    emailService.checkIfShouldSendEmail(models, emailCode, task.userId, () => {
        models
        .user
        .findById(task.userId)
        .then(user => {
            if (!user) {
                return console.error("USER_NOT_FOUND");
            }
    
            vqAuth
                .getEmailsFromUserId(models, user.vqUserId, (err, rUserEmails) => {
                    if (err) {
                        return console.error(err);
                    }
    
                    const emails = rUserEmails
                        .map(_ => _.email);

                    getDomainName(models, (err, domain) => {
                        if (err) {
                            return console.error(err);
                        }
    
                        let ACTION_URL;

                        if (emailCode === "task-request-cancelled") {
                            ACTION_URL = `${domain}/app/task/${task.id}`;
                        } else {
                            ACTION_URL = `${domain}/app/new-listing`;  
                        }

                        emailService
                        .getEmailAndSend(models, emailCode, emails, {
                            ACTION_URL,
                            LISTING_TITLE: task.title
                        });
                    });    
                    
                });
            }, err => console.error(err));
    });
};

taskEmitter
    .on("marked-spam", handlerFactory("task-marked-spam"));

taskEmitter
    .on("task-request-cancelled", handlerFactory("task-request-cancelled"));

taskEmitter
    .on("new-task", (models, taskId) => {
        if (!taskId) {
            return console.error("TASK_NOT_FOUND");
        }

        var taskCategory, userPreferences;
        var emailData = {};
        const userEmails = [];

        async.waterfall([
            cb => {
                models
                .taskCategory
                .findOne({
                    where: {
                        taskId
                    }
                })
                .then(rTaskCategory => {
                    taskCategory = rTaskCategory;

                    cb();
                }, cb);
            },
            cb => {
                models
                .userPreference
                .findAll({
                    where: {
                        value: taskCategory.code
                    }
                })
                .then(rUserPreferences => {
                    userPreferences = rUserPreferences;

                    cb();
                }, cb);
            },
            cb => {
                getDomainName(models, (err, domain) => {
                    if (err) {
                        return cb(err);
                    }

                    emailData.ACTION_URL =
                    `${domain}/app/task/${taskId}`;

                    cb();
                });
            },
            cb => {
                async
                .eachSeries(userPreferences, (userPreference, cb) => {
                        const userId = userPreference.userId;
                  
                        models
                        .user
                        .findById(userId)
                        .then(user => {
                            // in case of data inconsensities
                            if (!user) {
                                console.error(`user ${userId} could not be found but there is a preference to him`);

                                return cb();
                            }

                            emailService
                            .checkIfShouldSendEmail(models, emailService.EMAILS.NEW_LISTING, userId, () =>
                                vqAuth
                                .getEmailsFromUserId(models, user.vqUserId, (err, rUserEmails) => {
                                    if (err) {
                                        console.error(err);

                                        return cb();
                                    }
                    
                                    const emails = rUserEmails
                                        .forEach(_ => {
                                            userEmails.push(_.email);
                                        });

                                    cb();
                                })
                            , () => {
                                cb();
                            });
                        }, err => {
                            console.error(err);
    
                            cb();
                        });
                    }, () => {
                        emailService
                        .getEmailAndSend(models, emailService.EMAILS.NEW_LISTING, userEmails, emailData);
                     

                        console.log("New task emails have been sent!");
                    });
            }
        ]);
    });

taskEmitter
    .on("cancelled", handlerFactory("listing-cancelled"));


if (module.parent) {
    module.exports = taskEmitter;
} else {
    //console.log(process.argv[2]);
    //console.log(process.argv[3]);
    
    taskEmitter.emit(process.argv[2], process.argv[3]);
}
