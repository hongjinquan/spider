var cheerio = require('cheerio');
var http = require('http');
var tool = require('./tool');
const { loggerInfo, loggerError } = require('../common/logger')

const liveUrl = 'http://v.huatu.com/API/web_v/class/liveClassList.php?examType=1000&province=1000&price=1000&order=0';
const classUrl = 'http://v.huatu.com/API/web_v/class/classList.php?examType=1000&province=1000&price=1000&subject=1000&order=1';
const liveSetUrl = 'http://v.huatu.com/API/web_v/class/liveClassList.php?action=getCollectionInfo&examType=1000&province=1000&price=1000&order=0&collectionid='
const classSetUrl = 'http://v.huatu.com/API/web_v/class/classList.php?action=getCollectionInfo&examType=1000&province=1000&subject=1000&price=1000&order=1&collectid='
// 华图
let findCoursesUrl = async () => {
    return Promise.all([
        fetchCourseList('live'),
        fetchClassCourseList()
    ])
        .then(datas => {
            let allData = datas.reduce((a, b) => [...a, ...b])
            return Promise.resolve(allData)
        })
}

// 获取单个直播内部的所有课程
let fetchCourseList = (type = 'live', page = 1) => {
    return new Promise(async (resolve, reject) => {
        var url = (type === 'live' ? liveUrl : classUrl) + '&page=' + page;
        let json = await tool.fetchJson(url);
        let totalPages = Math.ceil(json.data.totalCount / 12);
        var courseInfos;
        loggerInfo('华图：fetchCourseList-json', json);
        if (type === 'live') {
            courseInfos = json.data.data;
        } else {
            courseInfos = json.data.result;
        }
        for (var index = 2; index <= totalPages; index++) {
            let tempJson = await tool.fetchJson(liveUrl + '&page=' + index);
            loggerInfo('华图：fetchCourseList-tempJson', tempJson);
            if (type === 'live') {
                courseInfos = [...courseInfos, ...tempJson.data.data]
            } else {
                courseInfos = [...courseInfos, ...tempJson.data.result]
            }
        }
        var infos = [];
        for (let index = 0; index < courseInfos.length; index++) {
            const element = courseInfos[index];
            if (element.collectionId && element.collectionId > 0) {
                let courseSet = await fetchCourseSetList(type, element.collectionId)
                courseSet.map(course => {
                    infos.push({
                        courseId: course.rid,
                        name: course.Title,
                        com: 'huatu',
                        url: `http://v.huatu.com/cla/class_detail_${element.rid}.htm`
                    })
                })
            } else {
                infos.push({
                    courseId: element.rid,
                    name: element.Title,
                    com: 'huatu',
                    url: `http://v.huatu.com/cla/class_detail_${element.rid}.htm`
                })
            }
        }
        resolve(infos)
    })

}
// 获取单个直播内部的所有课程
let fetchClassCourseList = (page = 1) => {
    return new Promise(async (resolve, reject) => {
        var url = classUrl + '&page=' + page;
        let json = await tool.fetchJson(url);
        let hasNext = json.data.next;
        var courseInfos;
        courseInfos = json.data.result;

        var infos = [];
        for (let index = 0; index < courseInfos.length; index++) {
            const element = courseInfos[index];
            if (element.collectionId && element.collectionId > 0) {
                let courseSet = await fetchCourseSetList('class', element.collectionId)
                courseSet.map(course => {
                    if (!course.rid) {
                        loggerInfo('华图course：', course);
                    }
                    infos.push({
                        courseId: course.rid,
                        name: course.Title,
                        com: 'huatu',
                        url: `http://v.huatu.com/cla/class_detail_${element.rid}.htm`
                    })
                })
            } else {
                if (!element.rid) {
                    loggerInfo('华图element：', element);
                }
                infos.push({
                    courseId: element.rid,
                    name: element.title,
                    com: 'huatu',
                    url: `http://v.huatu.com/cla/class_detail_${element.rid}.htm`
                })
            }
        }
        if (parseInt(hasNext) === 1) {
            let course = await fetchClassCourseList(page + 1);
            infos = [...infos, ...course]
        }
        resolve(infos)
    })

}
// 获取单个set课程的所有数据
let fetchCourseSetList = (type = 'live', collectionid) => {
    return new Promise(async (resolve, reject) => {
        let url = (type === 'live' ? liveSetUrl : classSetUrl) + collectionid;
        var courseInfos = await tool.fetchJson(url);
        if (Array.isArray(courseInfos.data.collectionInfo)) {
            resolve(courseInfos.data.collectionInfo);
        } else {
            var infos = courseInfos.data.collectionInfo;
            resolve(Object.keys(infos).map(key => infos[key]))
        }
    })
}
let getCourseInfo = (courseId) => {
    var url = `http://v.huatu.com/cla/class_detail_${courseId}.htm`;
    return new Promise((resolve, reject) => {
        http.get(url, function (res) {
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
            loggerError("华图：获取课程", courseId, '的html出现错误')
            loggerError("错误原因是：", error)
            resolve(null)
        });
    })
}

/* 过滤章节信息 */
function filterChapters(html, courseId) {
    var $ = cheerio.load(html);
    var courseInfo = {};
    courseInfo.name = $('.page-ncd-title').find('h1').text().trim();
    courseInfo.name = courseInfo.name.replace('"', "'")
    let price = $('.price').text();
    price = price.replace(/[^0-9]/ig, '');
    let number = $($('.coursestatus').find('.htred')[0]).text().trim();
    let classInfo = $('.classInfo').find('ul').children('li');
    const oneLi = classInfo.map((i, e) => { return $(e).text().trim() })
    let hour = oneLi[0];
    const strIndex = hour.indexOf('\n\t');
    hour = hour.slice(0, strIndex);
    let period = oneLi[1];
    const periodIndex = period.indexOf('\t');
    period = period.slice(0, periodIndex).trim();
    const teacher = oneLi[3];
    courseInfo.limit = 0;
    courseInfo.sell = parseInt(number) || 0;
    courseInfo.courseId = courseId;
    courseInfo.com = 'huatu';
    courseInfo.teacher = teacher;
    courseInfo.hour = hour;
    courseInfo.period = period;
    courseInfo.price = price;
    return courseInfo;
}

module.exports = {
    getCourseInfo: getCourseInfo,
    getAllCourseIdAndUrls: () => {
        return findCoursesUrl()
    },
}
