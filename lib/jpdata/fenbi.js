var cheerio = require('cheerio');
var https = require('https');
var tool = require('./tool');
const { loggerInfo, loggerError } = require('../common/logger')

const startUrl = 'https://fenbi.com/web/course';
const courseUrl = 'https://fenbi.com/web/users/course/';
const courseSetUrl = 'https://fenbi.com/web/users/courseset/'
// 粉笔
let findCoursesUrl = async () => {
    loggerInfo(`开始爬取粉笔startUrl`, startUrl);
    let html = await tool.fetchHtml(startUrl);
    loggerInfo(`结束爬取粉笔startUrl`, startUrl);
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
let fetchCourseList = (type) => {
    return new Promise(async (resolve, reject) => {
        var url = courseUrl + type;
        let json = await tool.fetchJson(url);
        let totalPages = json.paramList.totalPages;
        var courseInfos = json.courseInfo;
        for (let index = 2; index <= totalPages; index++) {
            let tempJson = await tool.fetchJson(url + '?start=' + index);
            courseInfos = [...courseInfos, ...tempJson.courseInfo]
        }
        var infos = [];
        for (let index = 0; index < courseInfos.length; index++) {
            const element = courseInfos[index];
            if (element.contentType === 3) {
                // 为集合
                let courseSet = await fetchCourseSetList(type, element.id)
                courseSet.courseInfo.map(course => {
                    const rsData = filterContentTypeContent(course.contentType, course, type)
                    infos.push(rsData)
                })
            } else if (element.contentType === 14) {
                // 为spu
                const rsData = filterContentTypeContent(element.contentType, element, type);
                infos.push(rsData);
            } else {
                // 其他内容，发现类型为0
                const rsData = filterContentTypeContent(element.contentType, element, type)
                infos.push(rsData)
            }
        }
        resolve(infos)
    })
}
let filterContentTypeContent = (contentType, element, type) => {
    // contentType此处分为两种：14从lectureSPUSummary中取值，0从lectureSummary中取值
    if (contentType === 14) {
        // spu
        const source = element.lectureSPUSummary;
        return {
            com: "fenbi",
            courseId: source.id,
            name: source.title || '无',
            url: 'https://fenbi.com/web/coursespu/' + type + '/' + source.id,
            price: source.priceShow || 0,
            sell: source.studentCount || 0,
            limit: source.studentLimit || 0,
            hour: source.contentHighlights && source.contentHighlights[0] && source.contentHighlights[0].highlight || 0,
            teacher: (source.teachers && source.teachers.map(item => item.name).join(',')) || '',
            startTime: source.classStartTime || '',
            period: source.classStopTime || '',
            type: source.productType && source.productType.name
        }
    } else {
        // 0
        const source = element.lectureSummary;
        return {
            com: "fenbi",
            courseId: source.id,
            name: source.title || '无',
            url: 'https://fenbi.com/web/coursedetail/' + type + '/' + source.id,
            price: source.price || 0,
            sell: source.studentCount || 0,
            limit: source.studentLimit || 0,
            hour: source.classHours || 0,
            teacher: (source.teachers && source.teachers.map(item => item.name).join(',')) || '',
            startTime: source.lectureStat && source.lectureStat.classStartTime || '',
            period: source.lectureStat && source.lectureStat.classStopTime || '',
            type: source.productType && source.productType.name
        }
    }
}
// 获取单个set课程的所有数据
let fetchCourseSetList = (type, setId) => {
    return new Promise(async (resolve, reject) => {
        let url = courseSetUrl + type + '/' + setId;
        var courses = [];
        var courseInfos = await tool.fetchJson(url);
        if (Array.isArray(courseInfos)) {
            resolve(courseInfos);
        } else {
            courses = courseInfos.courseInfo;
            let totalPages = courseInfos.paramList.totalPages;
            for (let index = 2; index <= totalPages; index++) {
                let temp = await tool.fetchJson(url + '?start=' + index);
                courses = [...courses, temp.courseInfo]
            }
            resolve(courseInfos);
        }
    })
}

// 获取所有类别
let findType = (html) => {
    var $ = cheerio.load(html);
    let typeDivs = $('.truman-filter-item');
    let temp = []
    typeDivs.map((index, element) => {
        temp.push($(element).find('button').data('prefix'))
    })
    return temp;
}

let getCourseInfo = (courseId) => {
    var url = `https://fenbi.com/web/coursedetail/gwy/${courseId}`;
    return new Promise((resolve, reject) => {
        https.get(url, function (res) {
            var html = '';
            res.on('data', function (data) {
                html += data;
            });
            res.on('end', function () {
                var courseData = filterChapters(html, courseId);
                if (!courseData) {
                    resolve(null)
                } else {
                    courseData.url = url;
                    resolve(courseData);
                }
            });
        }).on('error', function (error) {
            loggerError("粉笔：获取课程", courseId, '的html出现错误')
            loggerError("错误原因是：", error)
            resolve(null)
        });
    })
}

/* 过滤章节信息 */
function filterChapters(html, courseId) {
    var $ = cheerio.load(html);
    var courseInfo;
    let course = $('.course-detail-info')
    if (course.length === 0) {
        loggerError('粉笔, 没有课程')
    } else {
        courseInfo = {};

        let title = $(course).find('.course-detail-title').text().trim();
        courseInfo.name = title;

        let number = $(course).find('.student-str').text().trim();
        courseInfo.limit = 0;
        courseInfo.sell = 0;
        if (number.indexOf('人购买') > 0) {
            courseInfo.sell = number.split('人购买')[0].trim() * 1;
            if (number.split('人购买').length > 1 && number.split('人购买')[1] != "") {
                courseInfo.limit = number.split('人购买')[1].replace('剩余', '').replace('席位', '').trim() * 1 + courseInfo.sell
            }
        } else if (number.indexOf('席位') > 0) {
            courseInfo.sell = number.split('人购买')[0].trim() * 1 || 0;
            courseInfo.limit = number.replace('剩余', '').replace('席位', '').trim() * 1 + courseInfo.sell
        }
        courseInfo.courseId = courseId;
        courseInfo.com = 'fenbi';
    }
    return courseInfo;
}

module.exports = {
    getCourseInfo: getCourseInfo,
    fetchCourseSetList: fetchCourseSetList,
    fetchCourseList: fetchCourseList,
    getAllCourseIdAndUrls: () => {
        return findCoursesUrl()
    },
}
