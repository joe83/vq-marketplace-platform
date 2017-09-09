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

taskEmitter
    .on('marked-spam', task => {
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
                        .getEmailAndSend('task-marked-spam', emails[0]);
                });
        }, err => console.error(err));
    });

    if (module.parent) {
        module.exports = taskEmitter;
    } else {
        console.log(process.argv[2])
        console.log(process.argv[3])
        
        taskEmitter.emit(process.argv[2], process.argv[3]);
    }
