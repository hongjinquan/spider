var kaochong = require('./kaochong');
var course_api = require('../api/course_api');
var course_log_api = require('../api/course_log_api');
var kaochong = require('./kaochong')
var koolearn = require('./koolearn')
var youdao = require('./youdao')
var orangevip = require('./orangevip')
var fenbi = require('./fenbi')
var langlib = require('./langlib')
var huatu = require('./huatu')
let huatuNew = require('./huatuNew')
var xiaoguo = require('./xiaoguo')
var yiqikao = require('./17kjs')
const { loggerInfo, loggerError } = require('../common/logger');

module.exports = {
    start: () => {
        return course_api.getAll()
            .then(async datas => {
                let results = [];
                let tempLength = datas.length
                for (var i = 0; i < Math.ceil(tempLength / 10); i++) {
                    let course = datas.splice(0, 10);
                    let actions = course.map(data => {
                        // use
                        // if (data.com === 'koolearn') {
                        //     console.log('action-data-com', 1);
                        //     return koolearn.getCourseInfo(data.courseId)
                        // }
                        // if (data.com === 'youdao') {
                        //     console.log('action-data-com', 2);
                        //     return youdao.getCourseInfo(data.courseId)
                        // }
                        // if (data.com === 'orangevip') {
                        //     console.log('action-data-com', 3);
                        //     return orangevip.getCourseInfo(data.courseId)
                        // } 
                        // if (data.com === 'langlib') {
                        //     console.log('action-data-com', 4);
                        //     return langlib.getCourseInfo(data.courseId)
                        // } 
                        // if (data.com === 'huatu') {
                        //     console.log('action-data-com', 5);
                        //     return huatu.getCourseInfo(data.courseId)
                        // }
                        if (data.com === 'fenbi') {
                            console.log('action-data-com', 6);
                            return fenbi.getCourseInfo(data.courseId)
                        }
                        // use
                        // if (data.com === '17kjs') {
                        //     return yiqikao.getCourseInfo(data.courseId)
                        // }
                    })
                    let result = await Promise.all(actions);
                    results = [...results, ...result];
                }
                // let xiaoguoData = await xiaoguo.getAllCourseIdAndUrls();
                // results = [...results, ...xiaoguoData]
                // return course_log_api.add_17kjs(results);
                return course_api.insertToAll(results);
            }).catch(e => {
                console.log("出错了", e);
                throw (e)
            })
    },
    // 爬取所有官网的新课程
    startCrawlNewCourse: () => {

        /** ------------        新东方定时爬取数据         -------- */
        koolearn.getAllCourseIdAndUrls()
            .then(async datas => {
                var ids = [];
                datas.map(data => {
                    ids.push(data.courseId)
                })
                var hadCourse = await course_api.findCourseWithids(ids, 'koolearn');
                hadCourse = hadCourse.map(d => d.courseId);
                let needInsertCourse = datas.filter(data => !hadCourse.includes(parseInt(data.courseId)));
                loggerInfo('koolearn需要插入数: ', needInsertCourse.length);
                let successCount = 0;
                for (let index = 0; index < needInsertCourse.length; index++) {
                    const element = needInsertCourse[index];
                    element.com = 'koolearn'
                    let result = await course_api.add(element)
                    if (result && result.affectedRows === 1) {
                        successCount += 1;
                    }
                }
                loggerInfo('koolearn添加成功数: ', successCount);
            })
            .catch(error => {
                loggerError(error);
            })

        // /** ------------       有道精品课定时爬取数据        -------- */
        youdao.getAllCourseIdAndUrls()
            .then(async datas => {
                var ids = [];
                datas.map(data => {
                    ids.push(data.courseId)
                })
                var hadCourse = await course_api.findCourseWithids(ids, 'youdao');
                hadCourse = hadCourse.map(d => d.courseId);
                let needInsertCourse = datas.filter(data => {
                    return !hadCourse.includes(parseInt(data.courseId));
                });
                loggerInfo('youdao需要插入数: ', needInsertCourse.length);
                let successCount = 0;
                for (let index = 0; index < needInsertCourse.length; index++) {
                    const element = needInsertCourse[index];
                    element.com = 'youdao'
                    let result = await course_api.add(element)
                    if (result && result.affectedRows === 1) {
                        successCount += 1;
                    }
                }
                loggerInfo('youdao添加成功数: ', successCount);
            })
            .catch(error => {
                loggerError(error);
            })

        // /** ------------       粉笔网定时爬取数据        -------- */
        fenbi.getAllCourseIdAndUrls()
            .then(async datas => {
                var ids = [];
                datas.map(data => {
                    ids.push(data.courseId)
                })
                var hadCourse = await course_api.findCourseWithids(ids, 'fenbi');
                hadCourse = hadCourse.map(d => d.courseId);
                var needInsertCourse = [];
                needInsertCourse = datas.filter(data => {
                    return !hadCourse.includes(parseInt(data.courseId));
                });
                loggerInfo('fenbi需要插入数: ', needInsertCourse.length);
                let successCount = 0;
                for (let index = 0; index < needInsertCourse.length; index++) {
                    const element = needInsertCourse[index];
                    element.com = 'fenbi'
                    let result = await course_api.addCourse(element)
                    if (result && result.affectedRows === 1) {
                        successCount += 1;
                    }
                }
                loggerInfo('fenbi课程添加成功数: ', successCount);
            })
            .catch(error => {
                loggerError(error);
            })

        // /** ------------       橙啦网定时爬取数据        -------- */
        orangevip.getAllCourseIdAndUrls()
            .then(async datas => {
                var ids = [];
                datas.map(data => {
                    ids.push(data.courseId)
                })
                var hadCourse = await course_api.findCourseWithids(ids, 'orangevip');
                hadCourse = hadCourse.map(d => d.courseId);
                let needInsertCourse = datas.filter(data => {
                    return !hadCourse.includes(parseInt(data.courseId));
                });
                loggerInfo('orangevip需要插入数: ', needInsertCourse.length);
                let successCount = 0;
                for (let index = 0; index < needInsertCourse.length; index++) {
                    const element = needInsertCourse[index];
                    let result = await course_api.addCourse(element)
                    if (result && result.affectedRows === 1) {
                        successCount += 1;
                    }
                }
                loggerInfo('橙啦课程添加成功数: ', successCount);
            })
            .catch(error => {
                loggerError(error);
            })

        // /** ------------       华图网定时爬取数据        -------- */
        huatu.getAllCourseIdAndUrls()
            .then(async datas => {
                var ids = [];
                datas.map(data => {
                    ids.push(data.courseId)
                })
                var hadCourse = await course_api.findCourseWithids(ids, 'huatu');
                hadCourse = hadCourse.map(d => d.courseId);
                let needInsertCourse = datas.filter(data => {
                    return !hadCourse.includes(parseInt(data.courseId));
                });
                loggerInfo('华图课程需要插入数: ', needInsertCourse.length);
                let successCount = 0;
                for (let index = 0; index < needInsertCourse.length; index++) {
                    const element = needInsertCourse[index];
                    let result = await course_api.addCourse(element)
                    if (result && result.affectedRows === 1) {
                        successCount += 1;
                    }
                }
                loggerInfo('华图课程添加成功数: ', successCount);
            })
            .catch(error => {
                loggerError(error);
            })

        // 一起考教师定时爬取数据 
        yiqikao.getAllCourseInfo().then(async datas => {
            let successCount = 0;
            const ids = datas.map(item => item.courseId);
            const curCousers = await course_api.findCourseWithids(ids, '17kjs');
            const curIds = curCousers.map(item => item.courseId);
            const needAddData = datas.filter(item => {
                return !curIds.includes(parseInt(item.courseId));
            })
            loggerInfo("一起考教师，需要插入的数据数量为", needAddData.length);
            for (let i = 0, total = needAddData.length; i < total; i++) {
                const result = await course_api.addCourse(needAddData[i]);
                if (result && result.affectedRows === 1) {
                    successCount += 1;
                }
            }
            loggerInfo("一起考教师,成功添加的课程数量为：", successCount);
        })
            .catch(err => {
                loggerError('一起考教师，error:', err);
            })

        /** ------------       一笑而过网定时爬取数据        -------- */
        // xiaoguo.getAllCourseIdAndUrls()
        // .then(async datas => {
        //     var ids = [];
        //     datas.map(data => {
        //         ids.push(data.courseId)
        //     })
        //     console.log('xiaoguo-getAllCourseIdAndUrls--ids', ids);
        //     var hadCourse = await course_api.findCourseWithids(ids, 'xiaoguo');
        //     hadCourse = hadCourse.map(d => d.courseId);
        //     let needInsertCourse = datas.filter(data => { 
        //         return !hadCourse.includes(parseInt(data.courseId));
        //     });
        //     console.log('需要插入数: ',needInsertCourse.length);
        //     let successCount = 0;
        //     for (let index = 0; index < needInsertCourse.length; index++) {
        //         const element = needInsertCourse[index];
        //         try{
        //             let result = await course_api.addCourse(element)
        //             if(result && result.affectedRows === 1){
        //                 successCount += 1;
        //             }
        //         }catch(error){
        //             console.log('错误: ',error)
        //         }
        //     }
        //     console.log('一笑而过课程添加成功数: ',successCount);
        // })
    },
    startCrawNewCourse_17kjs: () => {
        // 一起考教师定时爬取数据 
        yiqikao.getAllCourseInfo().then(async datas => {
            let successCount = 0;
            const ids = datas.map(item => item.courseId);
            const curCousers = await course_api.findCourseWithids(ids, '17kjs');
            const curIds = curCousers.map(item => item.courseId);
            const needAddData = datas.filter(item => {
                return !curIds.includes(parseInt(item.courseId));
            })
            loggerInfo("一起考教师，需要插入的数据数量为", needAddData.length);
            for (let i = 0, total = needAddData.length; i < total; i++) {
                const result = await course_api.addCourse(needAddData[i]);
                if (result && result.affectedRows === 1) {
                    successCount += 1;
                }
            }
            loggerInfo("一起考教师,成功添加的课程数量为：", successCount);
        })
            .catch(err => {
                loggerError('一起考教师，error:', err);
            })
    },
    startCrawNewCourse_youdao: () => {
        // /** ------------       有道精品课数据        -------- */
        youdao.getAllCourseIdAndUrls()
            .then(async datas => {
                var ids = [];
                datas.map(data => {
                    ids.push(data.courseId)
                })
                var hadCourse = await course_api.findCourseWithidsInAll(ids, 'youdao');
                hadCourse = hadCourse.map(d => d.courseId);
                let needInsertCourse = datas.filter(data => {
                    return !hadCourse.includes(parseInt(data.courseId));
                });
                loggerInfo('youdao需要插入数: ', needInsertCourse.length);
                let tempLength = needInsertCourse.length;
                let results = [];
                for (var i = 0; i < Math.ceil(tempLength / 10); i++) {
                    let course = needInsertCourse.splice(0, 10);
                    let actions = course.map(data => {
                        return youdao.getCourseInfo(data.courseId)
                    })
                    let result = await Promise.all(actions);
                    results = [...results, ...result];
                }
                let count = await course_api.insertToAll(results)
                loggerInfo('youdao添加成功数: ', count);
            })
            .catch(error => {
                loggerError(error);
            })
    },
    startCrawNewCourse_koolearn: () => {
        /** ------------        新东方定时爬取数据         -------- */
        koolearn.getAllCourseIdAndUrls()
            .then(async datas => {
                var ids = [];
                datas.map(data => {
                    ids.push(data.courseId)
                })
                var hadCourse = await course_api.findCourseWithids(ids, 'koolearn');
                hadCourse = hadCourse.map(d => d.courseId);
                let needInsertCourse = datas.filter(data => !hadCourse.includes(parseInt(data.courseId)));
                loggerInfo('koolearn需要插入数: ', needInsertCourse.length);
                let successCount = 0;
                for (let index = 0; index < needInsertCourse.length; index++) {
                    const element = needInsertCourse[index];
                    element.com = 'koolearn'
                    let result = await course_api.add(element)
                    if (result && result.affectedRows === 1) {
                        successCount += 1;
                    }
                }
                loggerInfo('koolearn添加成功数: ', successCount);
            })
            .catch(error => {
                loggerError(error);
            })
    },
    startCrawNewCourse_orangevip: () => {
        // /** ------------       橙啦网定时爬取数据        -------- */
        orangevip.getAllCourseIdAndUrls()
            .then(async datas => {
                loggerInfo('orangevip需要插入数: ', datas.length);
                let successCount = await course_api.insertToAll(datas)
                loggerInfo('橙啦课程添加成功数: ', successCount);
            })
            .catch(error => {
                loggerError(error);
            })

    },
    startCrawNewCourse_fenbi: () => {
        fenbi.getAllCourseIdAndUrls()
            .then(async datas => {
                loggerInfo('fenbi需要插入数: ', datas.length);
                const successCount = await course_api.insertToAll(datas)
                loggerInfo('fenbi课程添加成功数: ', successCount);
            })
            .catch(error => {
                loggerError(error);
            })
    },
    startCrawNewCourse_huatu: () => {
        // /** ------------       华图网爬取数据        -------- */
        huatuNew.getCourseInfoListData().then(async courseAllData => {
            loggerInfo('华图课程需要插入数: ', courseAllData.length);
            const needInsertCourse = courseAllData.map(item => {
                const { classId, title, teacherDesc, price, timeLength, count, limit } = item;
                const temp = timeLength.split(' ');
                return {
                    courseId: classId,
                    name: title,
                    teacher: teacherDesc,
                    price,
                    sell: count,
                    limit,
                    url: `http://v.huatu.com/cla/class_detail_${classId}.htm`,
                    hour: temp[1] || 0,
                    period: temp[0] || ''
                }
            })
            let successCount = await course_api.insertToAll(needInsertCourse);
            loggerInfo('华图课程添加成功数: ', successCount);
        }).catch(e => {
            loggerInfo('华图爬取出错了: ', e);
        })
    },
    testData: async () => {
        yiqikao.getAllCourseIdAndUrls().then(async datas => {
            let successCount = 0;
            const ids = datas.map(item => item.courseId);
            const curCousers = await course_api.findCourseWithids(ids, '17kjs');
            const curIds = curCousers.map(item => item.courseId);
            const needAddData = datas.filter(item => {
                return !curIds.includes(parseInt(item.courseId));
            })
            console.log("一起考教师，需要插入的数据数量为", needAddData.length);
            for (let i = 0, total = needAddData.length; i < total; i++) {
                const result = await course_api.addCourse(needAddData[i]);
                if (result && result.affectedRows === 1) {
                    successCount += 1;
                }
            }
            console.log("一起考教师,成功添加的课程数量为：", successCount);
        })
            .catch(err => {
                console.log('一起考教师，error:', err);
            })
    },
    testLog: async () => {
        let info = '';
        // info = await yiqikao.getCourseInfo('5895')
        // info = await youdao.getCourseInfo("0");
        // info = await koolearn.getCourseInfo("15987");
        // info = await fenbi.fetchCourseSetList(3, 957);
        // info = await fenbi.fetchCourseList('gwy');
        // info = await orangevip.fetchCourseList('https://www.orangevip.com/index?guids=222');
        // info = await orangevip.getCourseInfo('1088');
        info = await xiaoguo.getCourseInfo('5c137bf9ed7b131740e735c2');
        // info = await huatu.getCourseInfo('72875');
        // info = await huatuNew.categoryJson()
        console.log(info);
    },
    allTest: async () => {
        let base = {
            one: 1,
            two: 10001,
            three: 20001,
            four: 30001
        };
        let step = 2000;
        let needInsertCourse = Array(step).fill('1').map((item, index) => { return index + base.one });
        const tempLength = needInsertCourse.length;
        let results = [];
        for (var i = 0; i < Math.ceil(tempLength / 10); i++) {
            loggerInfo(`第${i + 1}批开始获取`)
            let course = needInsertCourse.splice(0, 10);
            let actions = course.map(value => {
                // return youdao.getCourseInfo(value)Í
                // return koolearn.getCourseInfo(value)
                return orangevip.getCourseInfo(value);
            })
            let result = await Promise.all(actions);
            results = [...results, ...result];
            loggerInfo(`第${i + 1}批完成获取`)
        }
        let count = await course_api.insertToAll(results)
        loggerInfo("保存数据成功，条数为：", count)
    }
} 