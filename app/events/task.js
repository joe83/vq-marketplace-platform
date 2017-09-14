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

const handlerFactory = emailCode => task => {
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
};

taskEmitter
    .on('marked-spam', handlerFactory('task-marked-spam'));

taskEmitter
    .on('cancelled', handlerFactory('listing-cancelled'));


if (module.parent) {
    module.exports = taskEmitter;
} else {
    console.log(process.argv[2])
    console.log(process.argv[3])
    
    taskEmitter.emit(process.argv[2], process.argv[3]);
}
