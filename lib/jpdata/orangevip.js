var cheerio = require('cheerio');
var https = require('https');
var tool = require('./tool');
const request = require('request');
const { loggerInfo, loggerError } = require('../common/logger')

const startUrl = 'https://www.orangevip.com';
// 橙啦
let findCoursesUrl = async () => {
    loggerInfo(`开始爬取orangevip的startUrl`, startUrl);
    let html = await tool.fetchHtml(startUrl);
    loggerInfo(`结束爬取orangevip的startUrl`, startUrl);
    let types = findType(html);
    let actions = types.map(type => {
        return fetchCourseList(type)
    })
    return Promise.all(actions)
        .then(datas => {
            let allData = datas.reduce((a, b) => [...a, ...b])
            return Promise.resolve(allData)
        })
}

// 获取单个内部的所有课程
let fetchCourseList = (url) => {
    return new Promise(async (resolve, reject) => {
        loggerInfo(`开始爬取orangevip的url`, url);
        let html = await tool.fetchHtml(url);
        loggerInfo(`开始爬取orangevip的url`, url);
        let $ = cheerio.load(html);
        var links = $('.courseBox')
        var urls = [];
        for (let index = 0; index < links.length; index++) {
            const element = links[index];
            let href = $(element).attr('href');
            var id = href.split('/').pop().split('.')[0];
            if (href.indexOf('guids') > 0) {
                let list = await fetchCourseList(startUrl + href)
                urls = [...urls, ...list]
            } else {
                let info = {
                    courseId: id,
                    name: $(element).find($('.title')).text(),
                    url: startUrl + href,
                    com: 'orangevip'
                }
                urls.push(info);
            }
        }
        resolve(urls)
    })

}

// 获取所有类别
let findType = (html) => {
    var $ = cheerio.load(html);
    let typeDivs = $('.categoryItem');
    var temp = []
    typeDivs.map((index, element) => {
        let href = $(element).attr('href');
        if (href.indexOf('http') < 0) {
            href = startUrl + href;
        }
        temp.push(href)
    })
    temp.splice(0, 1);
    return temp;
}

let getCourseInfo = (courseId) => {
    var url = `https://cl.orangevip.com/courseDetail/${courseId}`;
    return new Promise((resolve, reject) => {
        var htmlbody = ''
        request.get(url)
            .on('response', function (response) {
                response.on('data', (data) => {
                    htmlbody += data;
                })
                response.on('end', () => {
                    var courseData = filterChapters(htmlbody, courseId);
                    courseData.url = url;
                    resolve(courseData);
                })
            })
            .on('error', function (err) {
                loggerError('orangevip-getCourseInfo-error',err)
                resolve(null)
            })
    })
}

/* 过滤章节信息 */
function filterChapters(html, courseId) {
    var $ = cheerio.load(html);
    var data = $('.limit').text()
    var datas = data.split(' ');
    var sell = 0, limit = 0;
    if (data && datas.length > 1) {
        sell = datas[1].replace('报名', '').replace('人', '');
        limit = datas[0].replace('限', '').replace('人', '');
    }
    var courseTitle = $('.class-name').text().trim();
    var courseData = {
        sell: !sell ? 0 : sell,
        limit: !limit ? 0 : limit,
        name: courseTitle,
        com: 'orangevip',
        courseId: courseId
    };
    return courseData;
}

module.exports = {
    getCourseInfo: getCourseInfo,
    getAllCourseIdAndUrls: () => {
        return findCoursesUrl()
    },
}