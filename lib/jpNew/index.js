const youdao = require('./youdao')
const puppeteer = require('puppeteer');
const redisApi = require('../common/redishelper')
const fs = require('fs');
const tagUrl = [
    'https://xue.youdao.com/tag/828?Pdt=CourseWeb', // 逻辑英语
    'https://xue.youdao.com/tag/896?Pdt=CourseWeb', // 专四专八
    // 'https://xue.youdao.com/tag/414?Pdt=CourseWeb', // 实用英语
    // 'https://xue.youdao.com/tag/424?Pdt=CourseWeb', // 考研
    // 'https://xue.youdao.com/tag/870?Pdt=CourseWeb', // 四六级
    // 'https://xue.youdao.com/tag/572?Pdt=CourseWeb', // 雅思托福
]

const getAllCourseList = async (proxyAddress) => {
    if (!proxyAddress) {
        return;
    }
    const argsStr = `--proxy-server=http://${proxyAddress}`
    const options = {
        headless: true,
        args: [argsStr]
    };
    try {
        const browser = await puppeteer.launch(options);
        let rsList = await Promise.all(tagUrl.map(item => youdao.youdaoCourseList(browser, item)));
        browser.close();
        let allList = []
        rsList.forEach(item => {
            // 每个item是每个url的page数据数组
            const pageData = item.map(page => page);
            allList = [...allList, ...pageData]
        })
        console.log('allList', allList);
        if (!allList.length) {
            console.log('数据抓取失败，无数据, 重新抓取');
            main();
            return;
        }
    } catch (e) {
        if (e.name === "TimeoutError") {
            return;
        }
        // 代理没生效进行重试
        console.log('代理没生效，重新尝试', e);
        main();
    }
}

const getAllProxy = async () => {
    const proxyList = await redisApi.getAll();
    const proxyValue = Object.keys(proxyList);
    const randomNum = Math.floor(Math.random() * proxyValue.length);
    const oneProxy = proxyValue[randomNum];
    return oneProxy;
}
async function main() {
    let proxyAddress = await getAllProxy();
    console.log("proxyAddress", proxyAddress);
    let timer = null;
    if (!proxyAddress) {
        timer = setTimeout(() => {
            console.log('无代理地址可用，10秒后重试');
            clearTimeout(timer)
            main();
        }, 10000)
        return;
    }
    clearTimeout(timer)
    getAllCourseList(proxyAddress)
}
main();

