var cheerio = require('cheerio');
var http = require('http');
var tool = require('./tool');
const { loggerInfo, loggerError } = require('../common/logger')

/**
 * 获取华图在线的所有分类json
 */
const category = "http://v.huatu.com/htzx/js/category.json";
/**
 * 只有categoryId、province、page进行变化；
 * 只有国考provice是110，其他都是1000
 * page可以通过last_page进行获得最大的页码数
 */
const categaryUrl = "http://api.huatu.com/lumenapi/v5/pc/c/class_list?keyWord=&subject=1000&typeId=1000&price=1000&orderType=0"
/**
 * 从categary获取的数据中，如果有【id】则是集合，如果有classId则为实际的课程，
 * 如果是collect则通过cllect_url进行获取具体的课程信息
 * 其中collect是【id】的值，page可以通过last_page进行获得最大的页码数
 */
// eg: "http://api.huatu.com/lumenapi/v5/c/class/collect_detail?collectId=422&page=1";
const collectUrl = "http://api.huatu.com/lumenapi/v5/c/class/collect_detail";

const categoryJson = async () => {
    const cateJson = await tool.fetchJson(category);
    return cateJson;
}

const classUrlList = async () => {
    const baseData = await categoryJson();
    const classify = baseData["classify"];
    const cate = baseData["cate"];
    let results = [];
    classify.forEach(item => {
        const oneCate = cate[item.key];
        results = [...results, ...oneCate];
    })
    const listValues = results.map(item => {
        let str = ''
        if (item.categoryId == "1") {
            str = `province=110`;
        } else {
            str = `province=1000`;
        }
        return `${categaryUrl}&categoryId=${item.categoryId}&${str}`;
    })
    return getClassListData(listValues);
}

/**
 * 通过categoryId获取数据,返回所有的数据
 * @param {} listValues 对应的url链接列表
 */
const getClassListData = async (listValues) => {
    console.log(`getClassListData开始获取数据`);
    const listValuesLength = listValues.length;
    let results = [];
    for (let i = 0; i < listValuesLength; i++) {
        const oneUrl = listValues[i];
        const total = await getPageData(oneUrl, []);
        results = [...results, ...total]
    }
    console.log(`getClassListData获取到数据${results.length}条数据`);
    return results;
}

/**
 * 获取单个category的分页数据
 * @param {*} oneUrl 单个的category链接
 * @param {*} total 数据集合
 */
const getPageData = async (oneUrl, total) => {
    console.log(`getPageData开始获取${oneUrl}的数据`);
    const rsData = await tool.fetchJson(oneUrl);
    const uesData = rsData.data;
    if (Array.isArray(uesData) && !uesData.length) {
        return [];
    }
    const { data, last_page } = uesData;
    total = [...total, ...data]
    for (let j = 2; j <= last_page; j++) {
        const tempUrl = oneUrl + `&page=${j}`;
        const other = await tool.fetchJson(tempUrl);
        total = [...total, ...other.data]
    }
    console.log(`getPageData获取${oneUrl}的数据结束，总共${total.length}条`);
    return total;
}

/**
 * 通过collectId获取所有课程的信息
 */
const getCourseInfoListData = async () => {
    const collectList = await classUrlList();
    let results = [];
    collectList.forEach(async item => {
        if (item.classId) {
            results = [...results, item];
        } else {
            const query = `${collectUrl}?collectId=${item.id}`;
            const oneCollect = await getPageData(query, []);
            results = [...results, ...oneCollect]
        }
    })
    return results;
}

module.exports = {
    getCourseInfoListData,
    categoryJson
}

