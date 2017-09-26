const transformJSDateToSqlFormat = date => date
    .toISOString().slice(0, 19).replace('T', ' ');

const getUtcUnixTimeNow = () => {
    const now = new Date(); 
    const nowUtc = new Date(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()
    );
    const nowUtcUnix = nowUtc.getTime() / 1000;

    return nowUtcUnix;
};

module.exports = {
    getUtcUnixTimeNow,
    transformJSDateToSqlFormat
};