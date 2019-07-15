const kerberos = require('node-auth-kerberos')
const hiveMain = require('./hive')
kerberos.authenticate('node/kc@KC.COM', 'node123', function (err) {
    if (err) {
        console.log("Error: " + err);
    } else {
        console.log("OK");
        hiveMain.main();
    }
});