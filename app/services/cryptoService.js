"use strict"

const CryptoJS = require("crypto-js");
const config = require("../config/configProvider.js")();

const encodeObj = obj => {
    // the default value for private key sucks...
    const encodedHash = CryptoJS.AES
    .encrypt(JSON.stringify(obj), config.SECRET || 'blabla')
    .toString();

    return encodedHash;
};

const decodeObj = encodedHash => {
    // the default value for private key sucks...
    const obj = JSON.parse(
        CryptoJS.AES
        .decrypt(encodedHash, config.SECRET || 'blabla')
        .toString((CryptoJS.enc.Utf8))
    );

    return obj;
};

module.exports = {
    encodeObj,
    decodeObj
};