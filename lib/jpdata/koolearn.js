var child_process = require("child_process");
var cheerio = require('cheerio');
var tool = require('./tool');
const { loggerInfo, loggerError } = require('../common/logger');

// 开始爬取页面
const startUrl = 'http://www.koolearn.com/';

/**
 * url: 官网地址
 * hadGetUrl：已经获取到的地址数据
 */
let findCoursesUrl = (url = startUrl, hadGetUrl = []) => {
    // 爬取到的产品url数组
    var productUrls = [];
    return new Promise(async (resolve, reject) => {
        loggerInfo(`新东方开始爬取:${url}`);
        hadGetUrl.push(url)
        let html = await tool.fetchHtml(url);
        if (!html) {
            resolve(null);
            return;
        }
        // 解析html
        var $ = cheerio.load(html);
        // 获取a链接
        var links = $('a');
        // 其他的url的set集合
        var otherUrls = new Set();
        links.map((index, link) => {
            var href = $(link).attr('href');
            if (!href) {
                return;
            }
            if (href.indexOf('//') === 0) {
                href = 'http:' + href;
            }
            if (href.indexOf('http://www.koolearn.com') == 0) {
                href = encodeURI(href);
                if (href.indexOf('/product/') > 0) {
                    // 如果匹配到product，放入到产品的url数组中
                    productUrls.push(href);
                } else if (href.indexOf('http') === 0) {
                    // 没有匹配到product，匹配到的是以http开始的url
                    if (!hadGetUrl.includes(href)) {
                        // 在hadGetUrl中不存在，添加到otherUrls中。
                        otherUrls.add(href)
                    }
                }
            }
        })
        // otherUrls中数据为空时候，爬取结束
        if (otherUrls.size == 0) {
            loggerInfo('新东方爬取结束: ', url, '新增了', productUrls.length, '课程链接');
        } else {
            for (const url of otherUrls) {
                // 循环遍历otherUrls的url，进行获取数据
                // 递归调用findCoursesUrl，把otherUrls中的url逐个调用，然后放到hadGetUrl数组中。
                let result = await findCoursesUrl(url, hadGetUrl);
                // result 是返回的product的数组结果
                if (result) {
                    // 把获取到的数据合并到productUrls中
                    productUrls = [...result, ...productUrls];
                }
            }
            loggerInfo('新东方爬取结束: ', url, ' 发现 ', otherUrls.size, '个其他链接');
        }
        resolve(productUrls);
    })

}


let getCourseInfo = (courseId) => {
    var curl = `curl http://study.koolearn.com/api/product/\?productIds\=${courseId} --referer http://www.koolearn.com/`
    return new Promise((resolve, reject) => {
        var child = child_process.exec(curl, function (err, stdout, stderr) {
            try {
                let result = JSON.parse(stdout).data[0];
                if (!result) {
                    resolve({
                        url: `http://study.koolearn.com/api/product/\?productIds\=${courseId}`,
                        sell: 0,
                        limit: 0,
                        name: '',
                        com: 'koolearn',
                        courseId: courseId,
                        teacher: '',
                        type: '',
                        hour: '',
                        com: "koolearn"
                    })
                    return;
                }
                resolve({
                    url: `http://study.koolearn.com/api/product/\?productIds\=${courseId}`,
                    sell: result.buyNumber ? result.buyNumber : 0,
                    limit: result.stock ? result.stock : 0,
                    name: result.name,
                    com: 'koolearn',
                    courseId: courseId,
                    teacher: result.teachers.map(_ => _.teacherName).join(','),
                    type: result.productLineName,
                    hour: result.classHours,
                    com: "koolearn"
                })
            } catch (error) {
                loggerError('koolearn--getCourseInfo-error:', error);
                resolve({
                    url: `http://study.koolearn.com/api/product/\?productIds\=${courseId}`,
                    sell: 0,
                    limit: 0,
                    name: '',
                    com: 'koolearn',
                    courseId: courseId,
                    teacher: '',
                    type: '',
                    hour: '',
                    com: "koolearn"
                })
            }
        });
    })
}

module.exports = {
    getCourseInfo: getCourseInfo,
    getAllCourseIdAndUrls: () => {
        return findCoursesUrl().then(data => {
            // data为startUrl页面下以及子页面下的所有产品url的数组
            let keurls = new Set();
            data.map(d => {
                keurls.add(d);
            })
            let result = [];
            // 对每一个url进行解析获取到课程id
            // url: /**/**/**/**/a_b.c;
            for (const url of keurls) {
                var urlStrings = url.split('/')
                var idString = urlStrings[urlStrings.length - 1].split('.');
                //idString: [a_b, c]
                var ids = idString[0].split('_');
                //ids: [a,b]
                var id = ids[ids.length - 1];
                //id: b
                result.push({ courseId: id, url: url })
            }
            return Promise.resolve(result);
        })
    },
}