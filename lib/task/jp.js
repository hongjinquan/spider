const schedule = require('node-schedule');
const jpdata = require('../jpdata/index');
const jpNewData = require('../jpNew/index')
const { loggerError, loggerInfo } = require('../common/logger');

module.exports = {
    init: () => {
        let env = process.env['NODE_ENV'];
        if (env == "production") {
            loggerInfo('正式环境')
            // 正式环境
            startCollectNewProductJob();
            // startProductJob();
        } else {
            // 开发环境
            loggerInfo('开发环境')
            startCollectNewProductJob();
            // startProductJob();
        }
        loggerInfo('定时任务开启')
    }
}

/**
 * 每天20点，从目标官网获取课程信息
 */
let startCollectNewProductJob = () => {
    // jpdata.startCrawlNewCourse()
    jpNewData.startCrawlNewCourse();
    // var rule = new schedule.RecurrenceRule();
    // rule.hour = 20
    // rule.minute = 0
    // schedule.scheduleJob(rule, function () {
    //     // jpdata.startCrawlNewCourse()
    //     jpNewData.startCrawlNewCourse()
    // })
}

/**
 * 每小时通过数据库中存储的所有课程id获取对应的课程详情同时入库
 */
let startProductJob = () => {
    // jpdata.start()
    //     .then(data => {
    //         loggerInfo('每小时定时=》保存课程成功,数量:', data)
    //     })
    //     .catch(error => {
    //         loggerError('error:' + error);
    //     })
    jpNewData.startUpdateCourseInfo().then(rs => {
        console.log('jpNewData---startUpdateCourseInfo---rs', rs);
    }).catch(e => {
        console.log('jpNewData---startUpdateCourseInfo--e', e);
    })
    // var rule = new schedule.RecurrenceRule();
    // rule.minute = 1;
    // var j = schedule.scheduleJob(rule, function () {
    //     jpdata.start()
    //         .then(data => {
    //             loggerInfo('每小时定时=》保存课程成功,数量:', data)
    //         })
    //         .catch(error => {
    //             loggerError('error:' + error);
    //         })
    // })
}

/**
 * 测试代码
 */
let testProject = () => {
    // 测试：从表中获取课程id，获取对应课程信息，添加到log中
    // jpdata.start();
    // 测试：爬取到的全课程添加到course表中
    // jpdata.testData()
    // 根据对应id获取对应的课程信息
    jpdata.testLog()
    // jpdata.allTest()
}
