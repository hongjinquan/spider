const { loggerInfo } = require('../src/common/logger')

module.exports = {
    getConfig: () => {
        let env = process.env['NODE_ENV'];
        loggerInfo('config-index-启动环境: ', env);
        if (env == "production") {
            return require('./config.release');
        } else {
            return require('./config.dev');
        }
    }
}