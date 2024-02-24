const moment = require('moment-timezone');

function getCurrentRomeTime() {
    const romeTimeZone = 'Europe/Rome';
    return moment.tz(romeTimeZone).format('YYYY-MM-DD HH:mm:ss');
}

module.exports = { getCurrentRomeTime };

