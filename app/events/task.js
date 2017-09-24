"use strict"

const EventEmitter = require('events');
const async = require('async');
const emailService = require("../services/emailService");
class DefaultEmitter extends EventEmitter {}
const taskEmitter = new DefaultEmitter();
const randomstring = require("randomstring");
const config = require("../config/configProvider.js")();
const vqAuth = require("../config/vqAuthProvider");
const models  = require('../models/models');

const getDomainName = cb => {
    models
    .appConfig
    .findOne({
        where: {
            fieldKey: 'DOMAIN'
        }
    })
    .then(configField => {
        configField = configField || {};
        
        const domain = configField.fieldValue || 'http://localhost:3000';

        return cb(null, domain);
    }, cb);
};

const handlerFactory = emailCode => task => {
    emailService.checkIfShouldSendEmail(emailCode, task.userId, () => {
        models
        .user
        .findById(task.userId)
        .then(user => {
            if (!user) {
                return console.error('USER_NOT_FOUND');
            }
    
            vqAuth
                .getEmailsFromUserId(user.vqUserId, (err, rUserEmails) => {
                    if (err) {
                        return cb(err);
                    }
    
                    const emails = rUserEmails
                    .map(_ => _.email);
    
                    emailService
                        .getEmailAndSend(emailCode, emails[0]);
                });
            }, err => console.error(err));
    });
};

taskEmitter
    .on('marked-spam', handlerFactory('task-marked-spam'));

taskEmitter
    .on('new-task', taskId => {
        if (!taskId) {
            return console.error('TASK_NOT_FOUND');
        }

        models.taskCategory
        .findOne({
            where: {
                taskId
            }
        })
        .then(taskCategory => {
            models
            .userPreference
            .findAll({
                where: {
                    value: taskCategory.code
                }
            })
            .then(userPreferences => {
                getDomainName((err, domain) => {
                    const ACTION_URL = 
                    `${domain}/app/task/${taskId}`;   

                    async.eachSeries(userPreferences, (userPreference, cb) => {
                        const userId = userPreference.userId;

                        emailService.checkIfShouldSendEmail('new-task', userId, () => {
                            models
                            .user
                            .findById(userId)
                            .then(user => {
                                vqAuth
                                .getEmailsFromUserId(user.vqUserId, (err, rUserEmails) => {
                                    if (err) {
                                        console.error(err);
    
                                        return cb();
                                    }
                    
                                    const emails = rUserEmails
                                        .map(_ => _.email);

                                    emailService
                                        .getEmailAndSend('new-task', emails[0], ACTION_URL);
    
                                    cb();
                                });
                            }, err => {
                                console.error(err);
        
                                cb();
                            });
                        }, () => {
                            cb();
                        });
                    }, () => {
                        console.log("New task emails have been sent!");
                    });
                });
            });
        });
    });

taskEmitter
    .on('cancelled', handlerFactory('listing-cancelled'));


if (module.parent) {
    module.exports = taskEmitter;
} else {
    console.log(process.argv[2])
    console.log(process.argv[3])
    
    taskEmitter.emit(process.argv[2], process.argv[3]);
}
