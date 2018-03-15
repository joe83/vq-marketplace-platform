"use strict";

const CryptoJS = require("crypto-js");

const encodeObj = obj => {
    // the default value for private key sucks...
    const encodedHash = CryptoJS.AES
    .encrypt(JSON.stringify(obj), process.env.SECRET || "blabla")
    .toString();

    return encodedHash;
};

const decodeObj = encodedHash => {
    // the default value for private key sucks...
    const obj = JSON.parse(
        CryptoJS.AES
        .decrypt(encodedHash, process.env.SECRET || "blabla")
        .toString((CryptoJS.enc.Utf8))
    );

    return obj;
};

const buildVerificationUrl = (tenantId, user) => {
    const verificationToken = encodeObj(user);
    const builtServerUrl = process.env.APP_URL ? process.env.APP_URL.replace('?tenantId', tenantId) : `http://localhost:${process.env.PORT}`;
    const verificationUrl = `${builtServerUrl}/api/verify/email?code=${verificationToken}`;

    return verificationUrl;
};

module.exports = {
    encodeObj,
    decodeObj,
    buildVerificationUrl
};