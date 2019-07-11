const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const youdaoCourseList = async (browser, url) => {
    console.log(`开始爬取课程：${url}`);
    // const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    let j = 0;
    let aList;
    let countArr = [];
    while (true) {
        try {
            await page.waitFor(1000);
            aList = await scrollPage(page, ++j);
            const lengthTemp = aList.length;
            countArr.push(lengthTemp);
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
        const courseId = tempStr.slice(idIndex + 1);

        const children = $(item).children();
        const type = $(children[0]).text();
        const title = $(children[1]).text();
        const timeTemp = $(children[2]).text();
        const timeContent = timeTemp.split('|');
        const time = timeContent[0];
        const hour = timeContent[1];
        const teacher = $(children[3]).text();
        const sellData = $(children[4]).text()
        const sellIndex = sellData.indexOf('购买');
        const sell = sellData.slice(0, sellIndex + 2);
        const price = sellData.slice(sellIndex + 2)
        return {
            courseId,
            url,
            type,
            title,
            time,
            teacher,
            sell,
            price,
            hour
        }
    })

    console.log('对获取到的aList数据，组装完成，开始过滤数据');
    const newDataArr = [];
    Array.from(finallyData).forEach(element => {
        if (newDataArr.length === 0) {
            newDataArr.push(JSON.stringify(element));
            return;
        }
        const flag = newDataArr.some(item => item.courseId === element.courseId);
        if (flag) {
            return;
        }
        newDataArr.push(JSON.stringify(element));
    });
    console.log('对组装的aList数据过滤完成');
    console.log(`结束爬取课程：${url}`);
    return newDataArr;
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

module.exports = {
    youdaoCourseList: youdaoCourseList
}