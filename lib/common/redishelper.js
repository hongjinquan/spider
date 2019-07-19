const Redis = require('ioredis');
const Config = require('../../config')
const { redis } = Config.getConfig();
const options = {
    port: redis.port,
    host: redis.host,
    password: redis.password
};

const getAll = () => {
    return new Promise((resolve, reject) => {
        const redisClient = new Redis(options)
        redisClient.hgetall('useful_proxy').then(rs => {
            resolve(rs)
        }).catch(e => {
            reject(e)
        })
    })
}

module.exports = {
    getAll
}
