const youdao = require('./youdao')
const puppeteer = require('puppeteer');
const fs = require('fs');
const tagUrl = [
    'https://xue.youdao.com/tag/828?Pdt=CourseWeb', // 逻辑英语
    'https://xue.youdao.com/tag/896?Pdt=CourseWeb', // 专四专八
    'https://xue.youdao.com/tag/414?Pdt=CourseWeb', // 实用英语
    'https://xue.youdao.com/tag/424?Pdt=CourseWeb', // 考研
    'https://xue.youdao.com/tag/870?Pdt=CourseWeb', // 四六级
    'https://xue.youdao.com/tag/572?Pdt=CourseWeb', // 雅思托福
]

const getAllCourseList = async () => {
    const browser = await puppeteer.launch();
    let allList = [];
    const oneList = await Promise.all(tagUrl.map(item => youdao.youdaoCourseList(browser, item)));
    browser.close();
    allList = [...oneList]
    fs.writeFile('youdaoCourseList.txt', allList, (e) => {
        if (e) {
            console.log('写入文件出错了');
        }
        console.log('写入文件成功');
    })
}

getAllCourseList();
