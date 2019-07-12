const jshs2 = require('jshs2');
const { Configuration, IDLContainer, HiveConnection } = jshs2;
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./hive.config.json'));

const options = {};

options.auth = config[config.use].auth;
options.host = config[config.use].host;
options.port = config[config.use].port;
options.timeout = config[config.use].timeout;
options.username = config[config.use].username;
options.hiveType = config[config.use].hiveType;
options.hiveVer = config[config.use].hiveVer;
options.cdhVer = config[config.use].cdhVer;
options.thriftVer = config[config.use].thriftVer;
options.maxRows = config[config.use].maxRows;
options.nullStr = config[config.use].nullStr;
options.i64ToString = config[config.use].i64ToString;


const configuration = new Configuration(options);
const idl = new IDLContainer();



async function main() {
  idl.initialize(configuration).then(async (rs) => {
    console.log('=======', rs);
    let connection = new HiveConnection(configuration, idl);
    console.log('connection', connection);
    let cursor = await connection.connect();
    console.log('cursor', cursor);
    const data = await cursor.execute(config.Query.query);
    console.log('data', data);
  })
}

main();
