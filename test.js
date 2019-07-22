const puppeteer = require('puppeteer');
const testFun = async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const url = 'https://xue.youdao.com/tag/888?Pdt=CourseWeb'
    await page.goto(url);

    console.log('=========');
    const page1 = await browser.newPage();
    const url1 = 'https://xue.youdao.com/tag/888?Pdt=CourseWeb'
    await page1.goto(url1);
    setTimeout(async () => {
        await browser.close();
    }, 5000)
}

testFun();