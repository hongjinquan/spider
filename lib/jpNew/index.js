const youdao = require('./youdao')
const puppeteer = require('puppeteer');
const tool = require('../common/tool')
const hiveHelper = require('../common/hiveHelper')

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
    return rs;
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
        // TODO 从数据库中获取数据进行对比将没有的课程插入进去
        // ....
        // 将数据存放到hive中
        saveDataToHive(allList)
    }
}

const byHourGetCourseInfo = () => {
    const couseInfo = await queryDataByHive();
    // TODO 过滤数据获取url、courseid和com，通过url获取对应的课程信息
    let com = '';
    let browser = await tool.getBrower();
    if (com === "youdao") {
        // TODO 根据获取到同一个渠道的数据，根据数据长度随机生成不同的brower（不同的代理）去获取界面信息
        Promise.all(couseInfo.map(item => {
            youdao.getCourseInfoByUrl(browser, item.url, item.courseid)
        }))
    }
}

module.exports = {
    byDayGetCourse,
    byHourGetCourseInfo

}

