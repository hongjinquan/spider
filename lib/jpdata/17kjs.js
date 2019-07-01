/**
 * 一起考教师
 */
const cheerio = require('cheerio')
const http = require('http');
var tool = require('./tool');
const { loggerInfo, loggerError } = require('../common/logger')
// 官网地址
const startUrl = "http://www.17kjs.com";
// 商品详情地址
const detailsUrl = "/Course/goodsShelf_details?shelf_id="
// 课程详情地址
const courseUrl = "/Course/profile?course_id="
/**
 * 导航配置地址
 */
const nvaArr = [
    {
        title: "nav1",
        url: "/Course/together?exam=certification&type=written"
    }, {
        title: "nav2",
        url: "/Course/together?exam=certification&type=interview"
    }, {
        title: "nav3",
        url: "/Course/together?exam=recruit&type=written"
    }, {
        title: "nav4",
        url: "/Course/together?exam=recruit&type=interview"
    }];

/**
 * 总入口
 */
const getAllData = async () => {
    let contentArr = [];
    const allUrls = await getAllTypeIdsAndUrls();
    for (const item of allUrls) {
        // detail为通过每个导航url获取html界面的信息
        loggerInfo(`开始爬取一起考教师:${item}`);
        const detail = await tool.fetchHtml(item);
        const detailsIds = getDetailsIdsByType(detail);
        contentArr = [...contentArr, ...detailsIds]
    }
    loggerInfo("一起考教师爬取结束：过滤前数据量", contentArr.length)
    const rsContentArr = [];
    for (let item of contentArr) {
        let count = 0;
        if (!rsContentArr.length) {
            rsContentArr.push(item);
            continue;
        }
        for (let one of rsContentArr) {
            if (one.courseId === item.courseId) {
                break;
            }
            count += 1;
        }
        if (rsContentArr.length === count) {
            rsContentArr.push(item);
        }
        count = 0;
    }
    loggerInfo("一起考教师：过滤后数据量", rsContentArr.length)
    return rsContentArr;
}

/**
 * 获取导航上的产品大类id以及生产url
 */
const getAllTypeIdsAndUrls = async () => {
    let typeIds = [];
    const typeTemp = nvaArr.map(async (item) => {
        loggerInfo(`开始爬取一起考教师的导航上的产品大类:${item}`);
        let html = await tool.fetchHtml(startUrl + item.url)
        const ids = getOneTypeIds(html);
        return ids;
    })
    loggerInfo(`结束爬取一起考教师的导航上的产品大类`);
    await Promise.all([...typeTemp]).then(data => {
        data.map(item => {
            typeIds = [...typeIds, ...item]
        })
    })
    const goodsShelf_details = typeIds.map(item => {
        return startUrl + detailsUrl + item
    })
    return goodsShelf_details;
}

/**
 * 获取课程分类的所有id
 */
const getOneTypeIds = (param) => {
    const $ = cheerio.load(param);
    const type_ids = [];
    const rsHtml = $('#shelfArea').children('.tg-shelf-list').find($('.tg-shelf-one'));
    rsHtml.each(function (i, el) {
        const id = $(this).attr('id');
        type_ids.push(id);
    });
    return type_ids;
}
/**
 * 解析每个导航通过url获取后的html，返回导航中涉及到的所有课程的对应数据集合
 * @param {*} detailsHtml html内容
 */
const getDetailsIdsByType = (detailsHtml) => {
    const detailsIds = [];
    const $ = cheerio.load(detailsHtml);
    const rsHtml = $('#course-box').find($('.col-md-3'));
    rsHtml.each(function (i, el) {
        const objTemp = {
            "com": '17kjs'
        };
        const cText = $(this).children().attr('onclick');
        const begin = cText.indexOf('(');
        const end = cText.indexOf(',');
        const id = cText.slice(begin + 1, end);
        let name = $(this).find('.course-list-name').text();
        // let orange = $(this).find('.course-period').text();
        name = name.split('\n').filter(e => e !== '').map(item => item.replace(/\s/g, '')).join('');
        // orange = orange.split('\n').filter(e => e != '').map(item => item.replace(/\s/g, '')).toString();
        // if (orange.indexOf('限售') !== -1) {
        //     const limitStr = orange.split(',')[1];
        //     const lmitArr = limitStr.slice(0, -1).split('/');
        //     objTemp["sell"] = lmitArr[0] || 0;
        //     objTemp["limit"] = lmitArr[1] || 0;
        // } else {
        //     const beginIndex = orange.indexOf('已有');
        //     const endIndex = orange.indexOf('人');
        //     objTemp["sell"] = orange.slice(beginIndex + 2, endIndex) || 0;
        //     objTemp["limit"] = 0;
        // }
        objTemp["name"] = name;
        objTemp["courseId"] = id;
        objTemp["url"] = startUrl + courseUrl + id;
        detailsIds.push(objTemp)
    })
    return detailsIds;
}

/**
 * 通过id生成url，请求获取对应的html界面
 * @param {*} courseId 课程id
 */
const getCourseInfo = (courseId) => {
    var url = `${startUrl + courseUrl + courseId}`;
    return new Promise((resolve, reject) => {
        http.get(url, function (res) {
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
            loggerError("一起考教师：获取课程", courseId, '的html出现错误')
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

/**
 * 对每个课程id的html进行解析
 * @param {*} html 爬取到的html
 * @param {*} courseId 课程id
 * 返回组装后的数据集合：{name, sell, limit, com, courseId}
 */
const filterChapters = (html, courseId) => {
    let objTemp = {
        "com": '17kjs'
    }
    const $ = cheerio.load(html);
    const tag = $('.course-profile').find('.c-green').text();
    const title = $('.course-profile').find('.course-name').text();
    const teacher = $('.course-profile').find('.wid425').text();
    const price = $('.course-profile').find('.profile-price').text();
    // 授课时间、有效期等
    const timeAll = $('.profile-text-top').children().first().text();
    // const timeAll = "开课时间：2018.07.26 ~ 2018.07.27 / 课时 : 1 / 有效期：365天"
    let timeSet = timeAll.split("/");
    const timeData = timeSet.map((item) => {
        let index = item.indexOf(":");
        if (index === -1) {
            index = item.indexOf("：")
        }
        return item.slice(index + 1).trim()
    })
    let other = $('.course-profile').find('.profile-text-bottom').text();
    other = other.split('\n').filter(e => e.trim() != '').map(item => item.replace(/\s/g, '')).slice(1).toString();
    const othIndex = other.indexOf('限售')
    if (othIndex !== -1) {
        other = other.slice(othIndex)
        const limitStr = other.split(',')[1];
        const lmitArr = limitStr.slice(0, -1).split('/');
        objTemp["sell"] = lmitArr[0].trim() !== '' ? lmitArr[0].trim() : 0;
        objTemp["limit"] = lmitArr[1].trim() !== '' ? lmitArr[1].trim() : 0;
    } else {
        const beginIndex = other.indexOf('已有');
        const endIndex = other.indexOf('人');
        objTemp["sell"] = other.slice(beginIndex + 2, endIndex).trim() !== '' ? other.slice(beginIndex + 2, endIndex) : 0;;
        objTemp["limit"] = 0;
    }
    objTemp["price"] = price;
    objTemp["courseId"] = courseId;
    objTemp["name"] = title;
    objTemp["type"] = tag;
    objTemp["teacher"] = teacher;
    objTemp["startTime"] = timeData[0];
    objTemp["hour"] = timeData[1];
    objTemp["period"] = timeData[2];
    return objTemp;
}

module.exports = {
    getCourseInfo: getCourseInfo,
    getAllCourseInfo: () => {
        return getAllData()
    }
}