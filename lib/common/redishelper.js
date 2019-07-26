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

const insertCourses = (data) => {
    // const insertData = [{ "youdao": [1, 2, 3], "vip": [3, 4, 5] }]
    // data的格式如：insertData
    const redisClient = new Redis(options);
    redisClient.hmset('courseList', data, function () {
        console.log("数据存入redis完毕");
    })
}

const getCourseList = () => {
    const redisClient = new Redis(options);
    return new Promise((resolve, reject) => {
        redisClient.hgetall('courseList').then(rs => {
            resolve(rs);
        }).catch(e => {
            reject(e)
        })
    })

}

module.exports = {
    getAll,
    insertCourses,
    getCourseList
}
