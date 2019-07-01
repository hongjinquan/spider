var path = require('path');
module.exports = {
    PORT: 8000,
    mysql: {
        kaochong_jp: {
            host: "rm-2ze8m94d7h32nel9o.mysql.rds.aliyuncs.com",
            database: "kaochong_jp",
            user: "kc_jp",
            password: "08lZi7jWLOx6kWRbIjkUodaRdbjbQwN9",
            connectionLimit: 100,
            acquireTimeout: 5000,
            queueLimit: 100
        }
    },
    redis: {
        host: "r-2zeea7f034b57794.redis.rds.aliyuncs.com",
        port: '6379',
        pass: "FW^L^NRMs7eh@jsPAv"
    }
}