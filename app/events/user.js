"use strict"

const EventEmitter = require('events');
const async = require('async');
const randtoken = require('rand-token');
const emailService = require("../services/emailService");
const cryptoService = require("../services/cryptoService");
class DefaultEmitter extends EventEmitter {}
const userEmitter = new DefaultEmitter();
const randomstring = require("randomstring");
const CryptoJS = require("crypto-js");
const config = require("../config/configProvider.js")();

module.exports = userEmitter;

    userEmitter
    .on('created', user => {
        // the default value for private key sucks...
        const VERIFICATION_TOKEN = cryptoService.encodeObj(user);

        const VERIFICATION_LINK = 
            `${process.env.SERVER_URL || 'http://localhost:8080'}/api/verify/email?code=${VERIFICATION_TOKEN}`;

        return emailService.sendWelcome(user, VERIFICATION_LINK);
    });
