"use strict";

const CryptoJS = require("crypto-js");
const config = require("../config/configProvider.js")();

const encodeObj = obj => {
    // the default value for private key sucks...
    const encodedHash = CryptoJS.AES
    .encrypt(JSON.stringify(obj), config.SECRET || "blabla")
    .toString();

    return encodedHash;
};

const decodeObj = encodedHash => {
    // the default value for private key sucks...
    const obj = JSON.parse(
        CryptoJS.AES
        .decrypt(encodedHash, config.SECRET || "blabla")
        .toString((CryptoJS.enc.Utf8))
    );

    return obj;
};

const buildVerificationUrl = (tenantId, serverUrl, user) => {
    const verificationToken = encodeObj(user);
    let builtServerUrl;
    if (serverUrl) {
        builtServerUrl = serverUrl.replace("?tenantId?", tenantId);
    } else {
        if (process.env.ENV.toLowerCase() === 'production') {
            builtServerUrl = "https://?tenantId.vqmarketplace.com".replace("?tenantId?", tenantId);
        } else if (process.env.ENV.toLowerCase() === 'test') {
            builtServerUrl = "https://?tenantId.test.vqmarketplace.com".replace("?tenantId?", tenantId);
        } else if (process.env.ENV.toLowerCase() === 'development') {
            builtServerUrl = `http://localhost:${process.env.PORT}`;
        }
    }
    console.log(serverUrl)
    console.log(builtServerUrl);
    
    const verificationUrl = `${builtServerUrl}/api/verify/email?code=${verificationToken}`;

    return verificationUrl;
};

module.exports = {
    encodeObj,
    decodeObj,
    buildVerificationUrl
};