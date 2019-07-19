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
        host: "127.0.0.1",
        port: '6379',
        password: "kaochong_competitor"
    }
}