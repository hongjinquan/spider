const redisApi = require('./redishelper')
const puppeteer = require('puppeteer');

const getOneProxy = async () => {
    const proxyList = await redisApi.getAll();
    const proxyValue = Object.keys(proxyList);
    const randomNum = Math.floor(Math.random() * proxyValue.length);
    const oneProxy = proxyValue[randomNum];
    return oneProxy;
}

const getBrower = async () => {
    let proxyAddress = await getOneProxy();
    console.log("proxyAddress", proxyAddress);
    let timer = null;
    if (!proxyAddress) {
        timer = setTimeout(() => {
            console.log('无代理地址可用，10秒后重试');
            clearTimeout(timer)
            getBrower();
        }, 10000)
        return;
    }
    clearTimeout(timer)
    return await getLaunchBrower(proxyAddress)
}

const getLaunchBrower = async (proxyAddress) => {
    if (!proxyAddress) {
        return;
    }
    const argsStr = `--proxy-server=http://${proxyAddress}`
    const options = {
        headless: true,
        args: [argsStr]
    };
    return await puppeteer.launch(options);
}

module.exports = {
    getOneProxy,
    getBrower
}