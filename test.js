const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const testFun = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const url = 'https://xue.youdao.com/tag/888?Pdt=CourseWeb'
    const url1 = 'https://xue.youdao.com/tag/424?Pdt=CourseWeb'
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
                // console.log('停止滚动了');
                break;
            }
        } catch (e) {
            console.log(e);
            // console.log('停止滚动了');
            break
        }
    }

    const finallyData = aList.map((index, item) => {
        const url = $(item).attr('href');
        const children = $(item).children();
        const type = $(children[0]).text();
        const title = $(children[1]).text();
        const time = $(children[2]).text();
        const teacher = $(children[3]).text();
        const sellData = $(children[4]).text()
        return {
            url,
            type,
            title,
            time,
            teacher,
            sellData
        }
    })

    console.log(finallyData)

    await browser.close();
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


testFun();