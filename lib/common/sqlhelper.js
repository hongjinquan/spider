/**
 *  mysql 工具
 */
const mysql = require('mysql');

// 获取配置信息
const config = require('../../config/index').getConfig();
const mysqlconfig = config.mysql;
const pools = {};
Object.keys(mysqlconfig).map(key => {
    pools[key] = mysql.createPool(mysqlconfig[key])
})

module.exports = {
    query: (sql, callback, database = 'kaochong_jp') => {
        pools[database].getConnection((error, connection) => {
            if (error) {
                console.log('连接数据失败');
                callback(error);
            } else {
                connection.query(sql, (error, result) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, result);
                    }
                    connection.release()
                })
            }
        })
    },
    query_objc: (sql, objc, callback, database = 'kaochong_jp') => {
        pools[database].getConnection((error, connection) => {
            if (error) {
                console.log(err);
                callback(error);
            } else {
                connection.query(sql, objc, (error, result) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, result);
                    }
                    connection.release()
                })
            }
        })
    },

    pquery: function (sql, database = 'kaochong_jp') {
        return new Promise((rs, rj) => {
            pools[database].getConnection((err, conn) => {
                if (err) {
                    console.log(err);
                    rj(err);
                } else {
                    conn.query({ sql: sql, timeout: 60000 }, (err2, rwos) => {
                        conn.release();
                        if (err2) {
                            rj(err2)
                        } else {
                            rs(rwos);
                        }
                    });
                }
            });
        })

    },
    pqueryParam: function (sql, param, database = 'kaochong_jp') {
        return new Promise((rs, rj) => {
            pools[database].getConnection((err, conn) => {
                if (err) {
                    console.log(err);
                    rj(err);
                } else {
                    conn.query({ sql: sql, timeout: 60000 }, param, (err2, rwos) => {
                        conn.release();
                        if (err2) {
                            rj(err2)
                        } else {
                            rs(rwos);
                        }
                    });
                }
            });
        })

    }
}
