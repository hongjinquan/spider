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

// testFun();

function test() {
    // TODO 组装数据
    // 返回示例类型 {"youdao": [1,2,3], "other": [5,6,7]}
    const rs = `[{
        'kaochong_course.courseid': '29162',
        'kaochong_course.url': 'https://ke.youdao.com/course/detail/29162?Pdt=CourseWeb&inLoc=vp_pro_tag828',
        'kaochong_course.type': '逻辑英语',
        'kaochong_course.title': '带你用公式巧学英文',
        'kaochong_course.coursetime': '时间：2019.07.14 20:00 ',
        'kaochong_course.teacher': '钟平',
        'kaochong_course.sell': ' 已有6287人购买',
        'kaochong_course.price': '免费',
        'kaochong_course.coursehour': ' 5课时',
        'kaochong_course.create_time': '2019-07-16 18:20:00.0',
        'kaochong_course.com': "youdao",
        'kaochong_course.date': '2019-07-16'
    }]`;
    console.log("rs类型", typeof rs);
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

console.log(test());