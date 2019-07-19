const JDBC = require('jdbc');
const jinst = require('jdbc/lib/jinst');
const moment = require('moment');
const util = require('util');

const hiveHelperMain = () => {
    return new Promise((resolve, reject) => {
        if (!jinst.isJvmCreated()) {
            console.log('jinst.isJvmCreated');
            jinst.addOption('-Xrs');
            jinst.addOption('-Djavax.security.auth.useSubjectCredsOnly=false');
            jinst.setupClasspath([
                './drivers/hadoop-common-3.0.0-cdh6.0.1.jar',
                './drivers/hive-jdbc-2.1.1-cdh6.0.1.jar',
                './drivers/hive-jdbc-2.1.1-cdh6.0.1-standalone.jar',
                './drivers/hadoop-auth-3.0.0-cdh6.0.1.jar',
            ])
        }
        var conf = {
            url: 'jdbc:hive2://kc-bigdata-02.bj02:10000/;principal=hive/kc-bigdata-02.bj02@KC.COM;',
            drivername: 'org.apache.hive.jdbc.HiveDriver',
            properties: {
                "hadoop.security.authentication": "Kerberos"
            }
        };

        var hive = new JDBC(conf);

        console.log('hive-initialize:=============================>')
        hive.initialize(function (err) {
            if (err) {
                console.log('hive-initialize-err', err);
                resolve(null);
            }
        });

        console.log('hive-reserve:=============================>')
        hive.reserve((err, connObj) => {
            if (connObj) {
                console.log("hive-reserve-Connection : " + connObj.uuid);
                var conn = connObj.conn;
                conn.createStatement(function (err, statement) {
                    if (err) {
                        console.log(err);
                        resolve(null);
                    } else {
                        resolve(statement);
                    }
                })
            } else {
                console.log('hive-reserve-err:', err);
                resolve(null);
            }
        })
    })
}

const insertHive = async (loadData) => {
    if (!loadData.length) {
        console.log("需要保存的数据为空，不执行添加操作");
        return;
    }

    const statement = await hiveHelperMain();
    if (!statement) {
        console.log("hive连接失败，无statement");
        return;
    }
    const keys = Object.keys(loadData[0])
    const values = loadData.map(item => {
        return `(${keys.map(k => { return `'${item[k]}'` }).join(",")})`
    });
    const sql = "INSERT INTO competitor.kaochong_course partition (`date`='" + moment().format("YYYY-MM-DD") + `') (${keys.join(',')}) VALUES ${values.join(',')}`;
    statement.executeUpdate(sql, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("所有数据已经保存成功")
        }
    });
}

const queryHive = async () => {
    const statement = await hiveHelperMain();
    if (!statement) {
        console.log("hive连接失败，无statement");
        return [];
    }

    const sql = "select * from competitor.kaochong_course";
    return new Promise((resolve) => {
        statement.executeQuery(sql, function (err, resultset) {
            if (err) {
                console.log(err);
                resolve([])
            } else {
                console.log("数据查询成功")
                resultset.toObjArray(function (err, result) {
                    if (err) {
                        console.log('resultset.toObjArray.error', err)
                        resolce([]);
                        return;
                    }
                    if (!result.length) {
                        resolce([]);
                        return;
                    }
                    resolve(util.inspect(result));
                })
            }
        });
    })
}

module.exports = {
    insertHive,
    queryHive
}
