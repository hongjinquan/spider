const sqlhelper = require("../common/sqlhelper");
const kaochong = require("../jpdata/kaochong");
const koolearn = require("../jpdata/koolearn");
const youdao = require("../jpdata/youdao");
const fenbi = require("../jpdata/fenbi");
const orangevip = require("../jpdata/orangevip");
const moment = require("moment");
const { loggerInfo, loggerError } = require('../common/logger')

module.exports = {

  add: async course => {
    var info;
    if (course.com == "kaochong") {
      info = await kaochong.getCourseInfo(course.courseId);
    } else if (course.com == "koolearn") {
      info = await koolearn.getCourseInfo(course.courseId);
    } else if (course.com == "youdao") {
      info = await youdao.getCourseInfo(course.courseId);
    } else if (course.com == "fenbi") {
      info = await fenbi.getCourseInfo(course.courseId);
    } else if (course.com === "orangevip") {
      info = await orangevip.getCourseInfo(course.courseId);
    }
    if (info) {
      course.name = info.name;
      course.url = info.url;
    } else {
      return Promise.resolve(null);
    }
    let keys = Object.keys(course);
    let temp = [];
    let values = keys.map(key => {
      temp.push("?");
      return course[key];
    });
    let sql = `insert into jp_course (${keys},create_time) values (${temp.join(",")},now());`;
    return sqlhelper.pqueryParam(sql, values);
  },

  addCourse: course => {
    let { name, com, courseId, url } = course;
    let sql = `
            insert into jp_course 
            (name,com,courseId,url,create_time) 
            values (?,?,?,?,now());`;
    return sqlhelper.pqueryParam(sql, [name, com, courseId, url]);
  },

  addCourses: courses => {
    let { name, com, courseId, url } = courses;
    let sql = `
            insert into jp_course 
            (name,com,courseId,url,create_time) 
            values (?,?,?,?,now());`;
    return sqlhelper.pqueryParam(sql, [name, com, courseId, url]);
  },

  findOne: course => {
    let sql =
      "select count(*) count from jp_course where com = ? and courseId = ?";
    return sqlhelper
      .pqueryParam(sql, [course.com, course.courseId])
      .then(counts => {
        if (counts[0].count === 0) {
          return Promise.resolve(course);
        } else {
          return Promise.reject(new Error("已经添加这个课程了"));
        }
      });
  },

  getAll: () => {
    let sql = `
    select courseId,com 
    from jp_course
    where com != 'xiaoguo'
    group by com,courseId;
    `;
    return sqlhelper.pquery(sql);
  },

  getPage: (page, pageSize, com = "all", courseId = 0, name = "") => {
    var where = "where 1=1";

    if (com != "all") {
      where += ` and com = '${com}' `;
    }

    if (courseId != 0) {
      where += ` and courseId = ${courseId} `;
    }

    if (name != "") {
      where += ` and name like '%${name}%'`;
    }

    let sql = `
    select com,courseId from jp_course ${where}  
    group by com,courseId  
    order by create_time desc 
    limit ?,?;`;
    return sqlhelper
      .pqueryParam(sql, [(page - 1) * pageSize, pageSize * 1])
      .then(datas => {
        // 修改url
        let needUpdateData = datas.filter(data => !data.url);
        if (needUpdateData.length > 0) {
          let actions = needUpdateData.map(data => {
            let { courseId, com, id } = data;
            var url = "";
            if (com === "kaochong") {
              url = `http://www.kaochong.com/course/detail-${courseId}.html`;
            } else if (com === "koolearn") {
              url = `http://study.koolearn.com/api/product/\?productIds\=${courseId}`;
            } else if (com === "youdao") {
              url = `https://ke.youdao.com/course/detail/${courseId}`;
            } else if (com === "fenbi") {
              url = `https://fenbi.com/web/coursedetail/gwy/${courseId}`;
            } else if (com === "orangevip") {
              url = `https://cl.orangevip.com/courseDetail/${courseId}`;
            } else if (com === "langlib") {
              url = `https://www.langlib.com/Product/CET${courseId}/Buy`;
              if (courseId == 0) {
                url = `https://www.langlib.com/Product/Utility/Grammar`;
              }
            }
            return module.exports.updateUrl(id, url);
          });
          Promise.all(actions)
            .then(data => {
              loggerInfo("更新url 成功");
            })
            .catch(error => {
              loggerInfo("更新url error:", error.message);
            });
        }
        return Promise.resolve(datas);
      });
  },

  getCount: (com = "all", courseId = 0, name = "") => {
    var where = "where 1=1";
    if (com != "all") {
      where += ` and com = '${com}' `;
    }
    if (courseId != 0) {
      where += ` and courseId = ${courseId} `;
    }
    if (name != "") {
      where += ` and name like '%${name}%'`;
    }
    var sql = `
    select count(*) count from (
      select count(*) count from jp_course ${where}  group by com,courseId 
    ) t;`;
    return sqlhelper.pquery(sql);
  },

  getLogWithMouth: (year, month, courseId, com) => {
    let start = moment()
      .year(year)
      .month(month - 1)
      .startOf("month")
      .format("YYYY-MM-DD HH:mm:ss");
    let end = moment()
      .year(year)
      .month(month - 1)
      .endOf("month")
      .format("YYYY-MM-DD HH:mm:ss");
    let sql = `
            select *,DATE_FORMAT(create_time, '%Y-%m-%d %k') time
            from jp_log
            where create_time > ? 
            and create_time < ?
            and courseId = ?
            and com = ?
            group by create_time;
        `;
    return sqlhelper.pqueryParam(sql, [start, end, courseId, com]);
  },

  getAllLog: (courseId, com, start, end) => {
    let sql = `
            select *,DATE_FORMAT(create_time, '%Y-%m-%d %k') time
            from jp_log
            where courseId = ?
            and com = ?
            and to_days(create_time) >= to_days(?)
            and to_days(create_time) <= to_days(?)
            group by create_time;
        `;
    return sqlhelper.pqueryParam(sql, [courseId, com, start, end]);
  },

  updateUrl: (id, url) => {
    let sql = "update jp_course set url = ? where id = ?";
    return sqlhelper.pqueryParam(sql, [url, id]);
  },

  /**
   * TODO有问题
   */
  findCourseWithids: (ids, com) => {
    let sql = `
        select courseId, com 
        from jp_course 
        where courseId in (${ids.map(_ => '?').join(",")})
        and com = '${com}';`;
    return sqlhelper.pqueryParam(sql, ids);
  },

  findCourseWithidsInAll: (ids, com) => {
    let sql = `
    select courseId, com 
    from jp_all 
    where courseId in (${ids.map(_ => '?').join(",")})
    and com = '${com}';`;
    return sqlhelper.pqueryParam(sql, ids);
  },

  insertToAll: async (values) => {
    let count = 0;
    for (let index = 0; index < values.length; index++) {
      var sql = ''
      var value = values[index];
      try {
        var regex = /"/gi;
        value.name = value.name.replace(regex, "'")
        const { sell, limit, courseId, name, com, price, type, startTime, hour, period, url, teacher } = value;
        var valueStr = `(?,?,?,?,?,?,?,?,?,?,?,?,now())`
        sql = `
            insert into jp_all 
            (sell,limited,courseId,name,com,price,type,startTime,hour,period,teacher,url,create_time)
            values 
            ${valueStr}`;
        await sqlhelper.pqueryParam(sql, [sell, limit, courseId, name, com, price, type, startTime, hour, period, teacher, url])
        count += 1;
      } catch (error) {
        loggerError(value.com, ' : 存储 : ', value.name, '失败')
        loggerError('sql:', sql)
        loggerError('value:', JSON.stringify(value))
      }
    }
    return Promise.resolve(count)
  }
};
