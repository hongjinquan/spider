let fenbi = require('./fenbi')
let youdao = require('./youdao')
let orangevip = require('./orangevip')
let koolearn = require('./koolearn')
var course_log_api = require('../src/logic/course/course_log_api');
var course_api = require('../src/logic/course/course_api');

let fenbiact = async () => {
    var actions = [],infos = [];
    for (let index = 2250.7; index < Math.ceil(40000 / 10); index++) {
        actions = new Array(10).fill(0).map((_, i) => {
            return fenbi.getCourseInfo(index * 10 + i)
        })
        infos = await Promise.all(actions);
        console.log(infos)
        infos = infos.filter(_=>_)
        if(infos.length > 0){
            addCourse(infos, 'fenbi')
            // course_log_api.add(infos).then(data => {
            //     console.log(data)
            // })
            // .catch(error => {
            //     console.log(error)
            // })
        }
        
    }
}

let youdaoact = async () => {
    var actions = [],infos = [];
    for (let index = 448.9; index < Math.ceil(20000 / 10); index++) {
        actions = new Array(10).fill(0).map((_, i) => {
            console.log(index * 10 + i)
            return youdao.getCourseInfo(index * 10 + i)
        })
        infos = await Promise.all(actions);
        console.log(infos)
        infos = infos.filter(_=>_)
        if(infos.length > 0){
            addCourse(infos, 'youdao')
            // course_log_api.add(infos).then(data => {
            //     console.log(data)
            // })
            // .catch(error => {
            //     console.log(error)
            // })
        }
        
    }
}

let xdfact = async () => {
    for (let index = 125; index < Math.ceil(15000 / 100); index++) {
        console.log(index)
        let actions = new Array(100).fill(0).map((_, i) => {
            // console.log(index * 100 + i)
            return koolearn.getCourseInfo(index * 100 + i)
        })
        let infos = await Promise.all(actions);
        // console.log(infos)
        infos = infos.filter(_=>_)
        if(infos.length > 0){
            addCourse(infos, 'koolearn')
            // course_log_api.add(infos).then(data => {
            //     console.log(data)
            // })
            // .catch(error => {
            //     console.log(error)
            // })
        }
        
    }
}
let addCourse = async (datas, course) => {
    var ids = [];
    datas.map(data => {
        ids.push(data.courseId)
    })
    var hadCourse = await course_api.findCourseWithids(ids, course);
    hadCourse = hadCourse.map(d => d.courseId);
    let needInsertCourse = datas.filter(data => !hadCourse.includes(parseInt(data.courseId)));
    console.log('需要插入数: ',needInsertCourse.length);
    let successCount = 0;
    for (let index = 0; index < needInsertCourse.length; index++) {
        const element = needInsertCourse[index];
        element.com = course;
        let result = await course_api.addCourses(element)
        if(result && result.affectedRows === 1){
            successCount += 1;
        }
    }
    console.log('添加成功数: ',successCount);
}
// fenbiact()

// youdaoact()

let orangevipact = async () => {
    var actions = [],infos = [];
    for (let index = 0; index < Math.ceil(1000 / 10); index++) {
        actions = new Array(10).fill(0).map((_, i) => {
            console.log(index * 10 + i)
            return orangevip.getCourseInfo(index * 10 + i)
        })
        infos = await Promise.all(actions);
        console.log(infos)
        infos = infos.filter(_=>_)
        if(infos.length > 0){
            addCourse(infos, 'orangevip')
            course_log_api.add(infos).then(data => {
                console.log(data)
            })
            .catch(error => {
                console.log(error)
            })
        }
        
    }
}
// orangevipact()

