var path = require('path');
module.exports = {
    PORT: 8004,
    mysql: {
        // kaochong_jp: {
        //     database: "kaochong_jp",
        //     host: "39.96.173.160",
        //     user: "root",
        //     password: "08lZi7jWLOx6kWRbIjkUodaRdbjbQwN9",
        //     connectionLimit: 1000,
        //     queueLimit: 100
        // },
        kaochong_jp: {
            database: "kaochong_jp",
            host: "127.0.0.1",
            user: "root",
            password: "root",
            connectionLimit: 1000,
            queueLimit: 100
        }
    },
    redis: {
        host: "127.0.0.1",
        port: '6379',
        password: "root"
    }
}