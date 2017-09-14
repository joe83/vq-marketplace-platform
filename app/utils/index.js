const transformJSDateToSqlFormat = date => date
    .toISOString().slice(0, 19).replace('T', ' ');

module.exports = {
    transformJSDateToSqlFormat
};