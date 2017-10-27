"use strict"

const EventEmitter = require('events');
const async = require('async');
const randtoken = require('rand-token');
const emailService = require("../services/emailService");
const cryptoService = require("../services/cryptoService");
class DefaultEmitter extends EventEmitter {}
const userEmitter = new DefaultEmitter();
const CryptoJS = require("crypto-js");
const config = require("../config/configProvider.js")();
const vqAuth = require("../auth");

module.exports = userEmitter;
    userEmitter
    .on('created', (models, user) => {
        // the default value for private key sucks...
        const VERIFICATION_TOKEN = cryptoService.encodeObj(user);

        const VERIFICATION_LINK = 
        `${config.serverUrl || 'http://localhost:8080'}/api/verify/email?code=${VERIFICATION_TOKEN}`;

        return emailService.sendWelcome(models, user, VERIFICATION_LINK);
    });

    userEmitter
    .on('blocked', (models, user) => {
        emailService.getEmailAndSend(models, 'user-blocked', user.id, () => {
            vqAuth
            .getEmailsFromUserId(models, user.vqUserId, (err, rUserEmails) => {
                if (err) {
                    return cb(err);
                }

                const emails = rUserEmails
                .map(_ => _.email);

                emailService
                    .getEmailAndSend(models, 'user-blocked', emails[0]);
            });
        })
    });
