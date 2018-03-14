"use strict";

const EventEmitter = require("events");
const randtoken = require("rand-token");
const emailService = require("../services/emailService");
const cryptoService = require("../services/cryptoService");
class DefaultEmitter extends EventEmitter {}
const userEmitter = new DefaultEmitter();
const vqAuth = require("../auth");

module.exports = userEmitter;
    userEmitter
    .on("created", (models, user) => {
        const VERIFICATION_LINK = cryptoService.buildVerificationUrl(models.tenantId, user);

        return emailService
            .getEmailAndSend(models, emailService.EMAILS.WELCOME, user.emails[0], {
                VERIFICATION_LINK
            });
    });

    userEmitter
    .on("blocked", (models, user) => {
        vqAuth
        .getEmailsFromUserId(models, user.vqUserId, (err, rUserEmails) => {
            if (err) {
                return console.error(err);
            }

            const emails = rUserEmails
            .map(_ => _.email);

            emailService
                .getEmailAndSend(models, "user-blocked", emails, {});
        });
    });
