const JDBC = require('jdbc');
const jinst = require('jdbc/lib/jinst');
const asyncjs = require('async');
const util = require('util')

if (!jinst.isJvmCreated()) {
    console.log('hello');
    jinst.addOption('-Xrs');
    jinst.setupClasspath([
        './drivers/hadoop-common-3.0.0-cdh6.0.1.jar',
        './drivers/hive-jdbc-2.1.1-cdh6.0.1.jar',
        './drivers/hive-jdbc-2.1.1-cdh6.0.1-standalone.jar',
    ])
}


var conf = {
    url: 'jdbc:hive2://kc-bigdata-02.bj02:10000/;principal=hive/kc-bigdata-02.bj02@KC.COM',
    drivername: 'org.apache.hive.jdbc.HiveDriver',
    properties: {
    }
};

var hive = new JDBC(conf);

hive.initialize(function (err) {
    if (err) {
        console.log('initialize-err', err);
    }
});

// create the connection
hive.reserve(function (err, connObj) {
    if (connObj) {
        console.log("Connection : " + connObj.uuid);
        var conn = connObj.conn;

        asyncjs.series([
            //set hive paramters if required. A sample property is set below
            // function (callback) {
            //     conn.createStatement(function (err, statement) {
            //         if (err) {
            //             callback(err);
            //         } else {
            //             statement.execute("SET hive.metastore.sasl.enabled=false",
            //                 function (err, resultset) {
            //                     if (err) {
            //                         callback(err)
            //                     } else {
            //                         console.log("Seccessfully set the properties");
            //                         callback(null, resultset);
            //                     }
            //                 });
            //         }
            //     })
            // },
            // calling a select query in the session below.
            function (callback) {
                conn.createStatement(function (err, statement) {
                    if (err) {
                        callback(err);
                    } else {
                        console.log("Executing query.");
                        statement.executeQuery("select * from ods.`lesson` limit 10",
                            function (err, resultset) {
                                if (err) {
                                    console.log(err);
                                    callback(err);
                                } else {
                                    console.log("Query Output :")
                                    resultset.toObjArray(function (err, result) {
                                        if (result.length > 0) {
                                            console.log("foo :" + util.inspect(result));

                                            // Above statement inspects the result object. Useful for debugging.
                                            // Ex. output 
                                            //foo :[ { 'pokes.foo': 1, 'pokes.bar': 'a' },
                                            //   { 'pokes.foo': 2, 'pokes.bar': 'b' } ]

                                            for (var i = 0; i < result.length; i++) {
                                                var row = result[i];
                                                // Column names in the retured objects from 
                                                // hive are of the form <tablename>.<columnname>.
                                                // Below output uses this format for printing 
                                                // the column output.
                                                console.log(row["pokes.foo"])
                                            }
                                        }
                                        callback(null, resultset);
                                    })
                                }
                            });
                    }
                })
            }
        ])
    } else {
        console.log('reserve-err', err)
    }
});