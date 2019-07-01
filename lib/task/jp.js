const schedule = require('node-schedule');
const jpdata = require('../jpdata/index');
const { loggerError, loggerInfo } = require('../common/logger');

module.exports = {
    init: () => {
        let env = process.env['NODE_ENV'];
        if (env == "production") {
            loggerInfo('正式环境')
            // 正式环境
            startCollectNewProductJob();
            startProductJob();
        } else {
            // 开发环境
            loggerInfo('开发环境')
            //  -------一起考课程链接---------
            // jpdata.startCrawNewCourse_17kjs()
            // -------有道课程链接---------
            // jpdata.startCrawNewCourse_youdao()
            // -------新东方课程链接---------
            // jpdata.startCrawNewCourse_koolearn();
            // -------粉笔课程链接---------
            jpdata.startCrawNewCourse_fenbi()
            //  --------测试---------
            // testProject()
            // startProductJob();
        }
        loggerInfo('定时任务开启')
    }
}

/**
 * 每天20点，从目标官网获取课程信息
 */
let startCollectNewProductJob = () => {
    jpdata.startCrawlNewCourse()
    var rule = new schedule.RecurrenceRule();
    rule.hour = 20
    rule.minute = 0
    schedule.scheduleJob(rule, function () {
        jpdata.startCrawlNewCourse()
    })
}

/**
 * 每小时通过数据库中存储的所有课程id获取对应的课程详情同时入库
 */
let startProductJob = () => {
    jpdata.start()
        .then(data => {
            loggerInfo('每小时定时=》保存课程成功,数量:', data)
        })
        .catch(error => {
            loggerError('error:' + error);
        })

    var rule = new schedule.RecurrenceRule();
    rule.minute = 1;
    var j = schedule.scheduleJob(rule, function () {
        jpdata.start()
            .then(data => {
                loggerInfo('每小时定时=》保存课程成功,数量:', data)
            })
            .catch(error => {
                loggerError('error:' + error);
            })
    })
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
}
