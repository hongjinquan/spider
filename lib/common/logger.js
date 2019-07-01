const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'info';
module.exports = {
    loggerInfo: (...params) => {
        return logger.info(...params);
    },
    loggerError: (...params) => {
        return logger.error(...params);
    }
}
