var cheerio = require('cheerio');
var tool = require('./tool');
const request = require('request');
var fetch = require('node-fetch');
var superagent = require('superagent');
const agent = superagent.agent();
const startUrl = 'http://xiaoguo101.com/sc/course/list/font';

// 一笑而过

let body = {
    categoryId: null,
    pageSize: 1000,
    pageNo: 1
}

let headers = {
    "Cookie": 'SICHENGSESSIONID=OTQ3MTNlMDMtZDc1OC00YzAxLTk4ZjQtNDBmNTBlM2MwMWFk; UM_distinctid=16a5251e299360-0be431329efb0f-36697e04-13c680-16a5251e29a677; CNZZDATA1275253900=124379807-1556157115-%7C1556157115',
    // 'Cookie': `SICHENGSESSIONID=YmJjMWI5MTktODE4ZS00NTE1LTk4MDAtNzlkM2IwYTlkN2E4; Max-Age=604800; Expires=Tue, 15 Jan 2019 11:05:53 +0800; Path=/sc/; HttpOnly; SameSite=Lax`,
    // 'Cookie': `SICHENGSESSIONID=OWEyNDY4ZGQtZWY2ZC00OWM4LTlkZmEtMTI1NDQ4NmI4NmIx; UM_distinctid=167bf0f8bf2155-0349b752a5959f-35617600-240000-167bf0f8bf3180; CNZZDATA1275253900=1516692866-1545098726-%7C1545374674`,
    'Referer': 'http://xiaoguo101.com/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
    'Origin': 'http://xiaoguo101.com',
    'Host': 'xiaoguo101.com',
    "Accept": 'application/json',
    "Content-Type": 'application/json; charset=utf-8'
}

let findCoursesUrl = async () => {
    // let info = await fetch('http://xiaoguo101.com/sc/user/info')
    // agent.get('http://xiaoguo101.com/sc/user/info')
    // .then(()=>{
    //     agent.post(startUrl)
    //     .send(body)
    //     .set(headers)
    //     .set('cookie',sessionid)
    //     .end(function (err, sres) {
    //     // 常规的错误处理
    //         if (err) {
    //             console.log(err)
    //         } else {
    //             console.log(sres.text)
    //         }
    //     })
    // })
    // .catch(error => {
    //     console.log(error)
    // })
    // var sessionid = info.headers.get('Set-Cookie')
    // headers.Cookie = sessionid;
    let json = await tool.fetchJsonPost(startUrl, JSON.stringify(body), headers);
    if (parseInt(json.code) === 0) {
        return json.rows.map(data => {
            return {
                courseId: data.id,
                name: data.name,
                url: `http://xiaoguo101.com/#/detail/i/${data.id}/index`,
                com: 'xiaoguo',
                sell: data.sellCount,
                limit: 0,
            }
        })
    } else {
        return []
    }
}

let getCourseInfo = (courseId) => {
    var url = `https://pc.xiaoguo101.com/#/detail/i/${courseId}/index`;
    return new Promise((resolve, reject) => {
        var htmlbody = ''
        request.get(url)
            .on('response', function (response) {
                response.on('data', (data) => {
                    htmlbody += data;
                })
                response.on('end', () => {
                    var courseData = filterChapters(htmlbody, courseId);
                    courseData.url = url;
                    resolve(courseData);
                })
            })
            .on('error', function (err) {
                resolve(null)
            })
    })
}

/* 过滤章节信息 */
function filterChapters(html, courseId) {
    var $ = cheerio.load(html);
    var data = $('.ant-col-13').text().trim()
    var datas = data.split(' ');
    var sell = 0, limit = 0, hour = '';
    if (data && datas.length > 1) {
        sell = datas[1].replace('报名', '').replace('人', '');
        limit = datas[0].replace('限', '').replace('人', '');
        const index = datas[1].indexOf("人");
        hour = datas[1].slice(index + 1)
    }
    var courseTitle = $('.class-name').text().trim();
    let startTime = $('.begin-time').text().trim();
    let price = $('.price').text().trim();
    var courseData = {
        sell: !sell ? 0 : sell,
        limit: !limit ? 0 : limit,
        name: courseTitle,
        com: 'orangevip',
        courseId: courseId,
        startTime,
        price,
        hour
    };
    return courseData;
}

module.exports = {
    getCourseInfo: getCourseInfo,
    getAllCourseIdAndUrls: () => {
        return findCoursesUrl()
    },
}
