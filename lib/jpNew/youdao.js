const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const moment = require('moment');
const youdaoCourseList = async (browser, url) => {
    return new Promise(async (resolve, reject) => {
        console.log(`开始爬取课程：${url}`);
        const page = await browser.newPage();
        page.goto(url);

        console.log('等待30s，加载界面');
        await page.waitFor(30000);
        console.log('等待30s结束，界面加载完成');

        let j = 0;
        let aList;
        let countArr = [];
        while (true) {
            try {
                await page.waitFor(10000);
                console.log("开始滚动");
                aList = await scrollPage(page, ++j);
                console.log("滚动结束，返回数据", j);
                const lengthTemp = aList.length;
                countArr.push(lengthTemp);
                console.log('countArr', countArr);
                const flagArr = countArr.filter(item => item === lengthTemp);
                if (flagArr.length === 5) {
                    console.log('停止滚动了,获取到aList数据');
                    break;
                }
            } catch (e) {
                console.log(e);
                console.log('停止滚动了，出现错误了');
                break
            }
        }

        console.log('开始处理获取到的aList数据，进行组装');
        let finallyData = aList.map((index, item) => {
            const url = $(item).attr('href');

            const tempStr = url.split('?')[0];
            const idIndex = tempStr.lastIndexOf('/');
            const courseid = tempStr.slice(idIndex + 1);

            const children = $(item).children();
            const type = $(children[0]).text();
            const title = $(children[1]).text();
            const timeTemp = $(children[2]).text();
            const timeContent = timeTemp.split('|');
            const coursetime = timeContent[0];
            const coursehour = timeContent[1];
            const teacher = $(children[3]).text();
            const sellData = $(children[4]).text()
            const sellIndex = sellData.indexOf('购买');
            const sell = sellData.slice(0, sellIndex + 2);
            const price = sellData.slice(sellIndex + 2)
            const create_time = moment().format('YYYY-MM-DD HH:mm:ss')
            return {
                courseid,
                url,
                type,
                title,
                coursetime,
                teacher,
                sell,
                price,
                coursehour,
                create_time,
                com: "youdao"
            }
        })

        console.log('对获取到的aList数据，组装完成，开始过滤数据');
        const newDataArr = [];
        Array.from(finallyData).forEach(element => {
            if (newDataArr.length === 0) {
                newDataArr.push(element);
                return;
            }
            const flag = newDataArr.some(item => item.courseid === element.courseid);
            if (flag) {
                return;
            }
            newDataArr.push(element);
        });
        console.log('对组装的aList数据过滤完成');
        console.log(`结束爬取课程：${url}`);
        resolve(newDataArr)
    })
}

/* 页面滚动方法 */
const scrollPage = async (page, i) => {
    let content = await page.content();
    $ = cheerio.load(content);
    /*执行js代码（滚动页面）*/
    await page.evaluate(function (i) {
        /* 这里做的是渐进滚动，如果一次性滚动则不会触发获取新数据的监听 */
        for (var y = 0; y <= 1000 * i; y += 100) {
            window.scrollTo(0, y)
        }
    }, i)
    // 获取数据列表
    const aTag = $("a._1EMem");
    return aTag;
}

/**
 * 通过课程的具体url获取课程详细信息
 * @param {*} url 课程详情的url
 * @param {*} browser 生成的浏览器对象
 */
const getCourseInfoByUrl = async (browser, url, courseid) => {
    const page = await browser.newPage();
    await page.goto(url);

    // 获取界面内容
    let content = await page.content();
    // 分析界面上的数据获取可用的数据
    return filterChapters(content, courseid, url)
}

/**
 * 过滤界面的内容，获取需要的信息
 * @param {*} html 界面的内容
 * @param {*} courseid 课程id
 * @param {*} url 课程详情地址
 */
function filterChapters(html, courseid, url) {
    var $ = cheerio.load(html);
    var data = $('.prom>b')
    if (data.length >= 2) {
        var sell = $(data[0]).text() - $(data[1]).text()
    } else {
        var sell = parseInt($($('.course-status>em')[0]).text().trim());
    }
    const pTag = $('.info>p');
    const teacher = $(pTag[0]).text();
    const coursehour = $(pTag[1]).text();
    const coursetime = $(pTag[2]).text();
    const price = $('.pay').find('.price').text();
    var courseTitle = $($('.info')[0]).find('h1').text().trim();
    const create_time = moment().format('YYYY-MM-DD HH:mm:ss')
    var courseData = {
        com: 'youdao',
        courseid,
        url,
        title: courseTitle,
        coursetime,
        teacher,
        sell: !sell ? 0 : sell,
        price,
        coursehour,
        create_time,
    };
    return courseData;
}

module.exports = {
    youdaoCourseList: youdaoCourseList,
    getCourseInfoByUrl
}