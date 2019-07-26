const youdao = require('./youdao')
const puppeteer = require('puppeteer');
const tool = require('../common/tool')
const hiveHelper = require('../common/hiveHelper')
const redisHelper = require('../common/redishelper')

const youdao = require('./youdao')

const tagUrl = [
    'https://xue.youdao.com/tag/828?Pdt=CourseWeb', // 逻辑英语
    'https://xue.youdao.com/tag/896?Pdt=CourseWeb', // 专四专八
    'https://xue.youdao.com/tag/414?Pdt=CourseWeb', // 实用英语
    'https://xue.youdao.com/tag/424?Pdt=CourseWeb', // 考研
    'https://xue.youdao.com/tag/870?Pdt=CourseWeb', // 四六级
    'https://xue.youdao.com/tag/572?Pdt=CourseWeb', // 雅思托福
]

const getYoudaoAllCourseList = async (browser) => {
    try {
        let rsList = await Promise.all(tagUrl.map(item => youdao.youdaoCourseList(browser, item)));
        browser.close();
        let allList = []
        rsList.forEach(item => {
            // 每个item是每个url的page数据数组
            const pageData = item.map(page => page);
            allList = [...allList, ...pageData]
        })
        return allList;
    } catch (e) {
        if (e.name !== "TimeoutError") {
            // 代理没生效进行重试
            console.log('代理没生效，重新尝试', e);
            return [];
        }
    }
}

const saveDataToHive = (data) => {
    hiveHelper.insertHive(data);
}

const queryDataByHive = async () => {
    const rs = await hiveHelper.queryHive();
    console.log('查询的数据是：', rs);
    // TODO 组装数据
    // 返回示例类型 {"youdao": [1,2,3], "other": [5,6,7]}
    const rsTemp = rs.replace(/'/g, '"');
    const rsJson = JSON.parse(rsTemp);
    let rsData = {};
    rsJson.forEach(item => {
        const com = item["kaochong_course.com"];
        if (!rsData[com]) {
            rsData[com] = [item["kaochong_course.courseid"]];
            return;
        }
        rsData[com].push(item["kaochong_course.courseid"]);
    })
    console.log("组装好的课程id信息", rsData);
    return rsData;
}



async function byDayGetCourse(com) {
    let browser = await tool.getBrower();
    // 暂时做了有道的课程信息爬虫
    if (com === 'youdao') {
        const allList = await getYoudaoAllCourseList(browser)
        if (!allList.length) {
            console.log('数据抓取失败，无数据, 重新抓取');
            browser.close();
            main(browser);
            return;
        }
        browser.close();
    }
}

const byHourGetCourseInfo = async (com, courseids) => {
    // TODO 过滤数据获取url、courseid和com，通过url获取对应的课程信息
    let browser = await tool.getBrower();
    if (com === "youdao") {
        // TODO 根据获取到同一个渠道的数据，根据数据长度随机生成不同的brower（不同的代理）去获取界面信息
        const url = 'https://ke.youdao.com/course/detail/'
        Promise.all(courseids.spilt(',').map(id => {
            youdao.getCourseInfoByUrl(browser, url + id, id)
        })).then(rs => {
            console.log('------', rs);
        })
    }
}

const startCrawlNewCourse = async () => {
    // 从数据库中获取数据所有课程列表
    const rsData = await queryDataByHive();

    /**
     * 获取有道的课程信息
     */
    byDayGetCourse('youdao').then(allList => {
        // 与数据库中获取的数据进行对比, 将不存在的课程存储进去
        const needSaveData = allList.filter(item => {
            const com = item.com;
            const savedData = rsData[com];
            return !savedData.includes(item.courseid)
        })

        // 将没有保存过的数据存放到hive中
        saveDataToHive(needSaveData);

        // 将所有的课程信息保存在redis缓存，方便每小时的定时任务获取信息
        needSaveData.forEach(item => {
            const com = item.com;
            rsData[com].push(item.courseid);
        })
        // rsData的格式是：[{ "youdao": [1, 2, 3], "vip": [3, 4, 5] }]
        redisHelper.insertCourses(rsData);
    })
}

const startUpdateCourseInfo = async () => {
    const redisCourseList = await redisHelper.getCourseList();
    //redisCourseList结构为： { "youdao": '1,2,3', "vip": '4,5,6' }
    byHourGetCourseInfo('youdao', redisCourseList["youdao"]);
}

module.exports = {
    startCrawlNewCourse,
    startUpdateCourseInfo
}

