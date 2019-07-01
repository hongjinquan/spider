var cheerio = require('cheerio');
var https = require('https');
var fetch = require('node-fetch');
const { loggerError } = require('../common/logger');
// 朗播
let getCourseInfo = (courseId) => {
    // http://www.langlib.com/Product/CET6/Buy
    // http://www.langlib.com/Product/CET4/Buy
    var url = `https://www.langlib.com/Product/CET${courseId}/Buy`;
    if (courseId == 0) {
        url = `https://www.langlib.com/Product/Utility/Grammar`
    }
    return new Promise((resolve, reject) => {
        https.get(url, function (res) {
            var html = '';
            res.on('data', function (data) {
                html += data;
            });
            res.on('end', function () {
                var courseData = filterChapters(html, courseId);
                courseData.url = url;
                resolve(courseData);
            });
        }).on('error', function (error) {
            loggerError("朗播：获取课程", courseId, '的html出现错误')
            loggerError("错误原因是：", error)
            resolve(null)
        });
    })
}

/* 过滤章节信息 */
async function filterChapters(html, courseId) {
    var $ = cheerio.load(html);
    var sell = 0, limit = 0, courseTitle = "";
    if (courseId === 0) {
        courseTitle = $('.u-coursedate').text().trim() + $('.u-banner-title').text().trim();
        let number = await fetch('https://www.langlib.com/Product/Utility/GetRushInfo',{
            method: 'post'
        }).then(res => res.json())
        sell = number.PersonCount;
        limit = number.QuotaNum;
    } else {
        var data = $('.u-buy-amount').text().trim();
        sell = data.replace('购买人数：', '').replace('人', '').trim();
        courseTitle = $($('.u-title p')[0]).text().trim();
    }
    
    var courseData = {
        sell: !sell ? 0 : sell,
        limit: !limit ? 0 : limit,
        name: courseTitle,
        com: 'langlib',
        courseId: courseId
    };
    return courseData;
}

module.exports = {
    getCourseInfo: getCourseInfo,
}
