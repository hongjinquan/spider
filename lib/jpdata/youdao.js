var cheerio = require('cheerio');
var https = require('https');
var tool = require('./tool');
const { loggerError, loggerInfo } = require('../common/logger');

// 有道
// 开始爬取页面
const startUrl = 'https://ke.youdao.com/';

let findCoursesUrl = (url = startUrl, hadGetUrl = []) => {
    var productUrls = [];
    return new Promise(async (resolve, reject) => {
        loggerInfo(`有道开始爬取:${url} `)
        hadGetUrl.push(url)
        let html = await tool.fetchHtml(url);
        if (!html) {
            resolve(null);
            return;
        }
        var $ = cheerio.load(html);
        var links = $('a');
        var otherUrls = new Set();
        links.map((index, link) => {
            var href = $(link).attr('href');
            if (!href) {
                return;
            }
            if (href.indexOf('/tag/') === 0) {
                href = startUrl + href;
            }
            if (href.indexOf('https://ke.youdao.com/') == 0) {
                href = encodeURI(href);
                if (href.indexOf('/course/detail/') > 0) { // 课程页
                    productUrls.push(href);
                } else if (href.indexOf('http') === 0) { // 其他爬取页面
                    if (hadGetUrl.includes(href)) {

                    } else {
                        otherUrls.add(href)
                    }
                }
            }
        })
        if (otherUrls.size == 0) {
            loggerInfo('有道爬取结束: ', url, '新增了', productUrls.length, '课程链接');
        } else {
            for (const url of otherUrls) {
                let result = await findCoursesUrl(url, hadGetUrl);
                if (result) {
                    productUrls = [...result, ...productUrls];
                }
            }
            loggerInfo('有道爬取结束: ', url, ' 发现 ', otherUrls.size, '个其他链接');
        }
        resolve(productUrls);
    })

}


let getCourseInfo = (courseId) => {
    var url = `https://ke.youdao.com/course/detail/${courseId}`;
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
            loggerError("有道：获取课程", courseId, '的html出现错误')
            loggerError("错误原因是：", error)
            const objTemp = {};
            objTemp["sell"] = 0;
            objTemp["limit"] = 0;
            objTemp["price"] = 0;
            objTemp["courseId"] = courseId;
            objTemp["name"] = '';
            objTemp["type"] = '';
            objTemp["teacher"] = '';
            objTemp["startTime"] = '';
            objTemp["hour"] = '';
            objTemp["period"] = '';
            resolve({ ...objTemp })
        });
    })
}

/* 过滤章节信息 */
function filterChapters(html, courseId) {
    var $ = cheerio.load(html);
    var data = $('.prom>b')
    if (data.length >= 2) {
        var sell = $(data[0]).text() - $(data[1]).text()
        var limit = parseInt($(data[1]).text())
    } else {
        var sell = parseInt($($('.course-status>em')[0]).text().trim());
        var limit = 0;
    }
    const pTag = $('.info>p');
    const teacher = $(pTag[0]).text();
    const hour = $(pTag[1]).text();
    const startTime = $(pTag[2]).text();
    const period = $(pTag[3]).text();
    const price = $('.pay').find('.price').text();
    var courseTitle = $($('.info')[0]).find('h1').text().trim();
    var courseData = {
        sell: !sell ? 0 : sell,
        limit: !limit ? 0 : limit,
        name: courseTitle,
        com: 'youdao',
        courseId: courseId,
        teacher,
        hour,
        startTime,
        period,
        price
        };
    return courseData;
}

module.exports = {
    getCourseInfo: getCourseInfo,
    getAllCourseIdAndUrls: () => {
        return findCoursesUrl().then(data => {
            let keurls = new Set();
            data.map(d => {
                keurls.add(d);
            })
            let result = [];
            for (var url of keurls) {
                url = url.split('?')[0]
                var urlStrings = url.split('/')
                var id = urlStrings[urlStrings.length - 1]
                result.push({ courseId: id, url: url })
            }
            return Promise.resolve(result);
        })
    },
}
