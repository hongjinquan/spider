const sqlhelper = require('../common/sqlhelper');
const { loggerError, loggerInfo } = require('../common/logger')

module.exports = {
    add_17kjs: async (values) => {
        let count = 0;
        for (let index = 0; index < values.length; index++) {
            var sql = ''
            var value = values[index];
            try {
                var regex = /"/gi;
                value.name = value.name.replace(regex, "'")
                const { sell, limit, courseId, name, com, price, type, startTime, hour, period, teacher } = value;
                var valueStr = `(?,?,?,?,?,?,?,?,?,?,?,now())`
                sql = `
                insert into jp_log 
                (sell,limited,courseId,name,com,price,type,startTime,hour,period,teacher,create_time)
                values 
                ${valueStr}`;
                await sqlhelper.pqueryParam(sql, [sell, limit, courseId, name, com, price, type, startTime, hour, period, teacher])
                count += 1;
                loggerInfo("插入数据成功")
            } catch (error) {
                loggerError(value.com, ' : 存储 : ', value.name, '失败')
                loggerError('sql:', sql)
                loggerError('value:', JSON.stringify(value))
            }
        }
        return Promise.resolve(count)
        // const valuesTemp = [];
        // for (let index = 0; index < values.length; index++) {
        //     const value = values[index];
        //     if (!value) {
        //         return;
        //     }
        //     const regex = /"/gi;
        //     value.name = value.name.replace(regex, "'")
        //     const { sell, limit, courseId, name, com, price, type, startTime, hour, period } = value;
        //     const valueStr = `("${sell}","${limit}","${courseId}","${name}","${com}","${price}","${type}","${startTime}","${hour}","${period}",now())`;
        //     valuesTemp.push(valueStr);
        // }
        // let sql = `insert into jp_log (sell,limited,courseId,name,com,price,type,startTime, hour, period,create_time) values ${valuesTemp.join(',')}`;
        // return sqlhelper.pqueryParam(sql, [])
    },
    addOne: (value) => {
        let { sell, limit, courseId, name, com } = value;
        let sql = 'insert into jp_log (sell,limited,courseId,name,com,create_time) values (?,?,?,?,?,now())';
        return sqlhelper.pqueryParam(sql, [sell, limit, courseId, name, com])
    },
    add: async (values) => {
        for (let index = 0; index < values.length; index++) {
            var sql = ''
            var value = values[index];
            try {
                var regex = /"/gi;
                value.name = value.name.replace(regex, "'")
                let { sell, limit, courseId, name, com } = value;
                var valueStr = `(?,?,?,?,?,now())`
                sql = `
                insert into jp_log 
                (sell,limited,courseId,name,com,create_time)
                values 
                ${valueStr}`;
                await sqlhelper.pqueryParam(sql, [sell, limit, courseId, name, com])
                count += 1;
            } catch (error) {
                loggerError(value.com, ' : 存储 : ', value.name, '失败')
                loggerError('sql:', sql)
                loggerError('value:', JSON.stringify(value))
            }
        }
        return Promise.resolve(count)
    }
}