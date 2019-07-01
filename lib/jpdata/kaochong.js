
// 考虫
var http = require('http');
var cheerio = require('cheerio');


let getCourseInfo = (courseId) => {
    var url = `http://www.kaochong.com/course/detail-${courseId}.html`;
    return new Promise((resolve,reject) => {
        http.get(url, function (res) {
            var html = '';
            res.on('data', function (data) {
                html += data;
            });
            res.on('end', function () {
                var courseData = filterChapters(html,courseId);
                courseData.url = url;
                resolve(courseData);
            });
        }).on('error', function (error) {
            console.log(courseId,':出现错误')
            resolve(null)
        });
    })
    
}
// 定义爬虫的目标地址
/* 过滤章节信息 */
function filterChapters(html,courseId) {
    var $ = cheerio.load(html);
    var sell = $($('.quota_hd')[0]).find('em').text().trim().replace('人', '');
    var limit = $($($('.detail_limit_hd')[0]).find('span')[1]).text().trim().replace('人', '');
    var courseTitle = $($('.detail_title_hd')[0]).text().trim().split('\n')[0];
    var courseData = {
        sell: !sell ? 0 : sell,
        limit: !limit ? 0 : limit,
        name: courseTitle,
        com:'kaochong',
        courseId: courseId,
    };
    return courseData;
}


module.exports = {
    getCourseInfo: getCourseInfo,
}
