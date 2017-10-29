"use strict"

const EventEmitter = require('events');
const async = require('async');
const randtoken = require('rand-token');
const emailService = require("../services/emailService");
const cryptoService = require("../services/cryptoService");
class DefaultEmitter extends EventEmitter {}
const userEmitter = new DefaultEmitter();
const config = require("../config/configProvider.js")();
const vqAuth = require("../auth");
const util = require("../util");

module.exports = userEmitter;
    userEmitter
    .on('created', (models, user) => {
        const VERIFICATION_LINK = cryptoService.buildVerificationUrl(models.tenantId, config.SERVER_URL, user);

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
