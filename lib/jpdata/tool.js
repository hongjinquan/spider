var https = require('https');
var fetch = require('node-fetch');

var request = require("request");
const { loggerError } = require('../common/logger');

module.exports = {
    downloadHtml: (url) => {
        return new Promise((resolve, reject) => {
            https.get(url, function (res) {
                var html = '';
                res.on('data', function (data) {
                    html += data;
                });
                res.on('end', function () {
                    resolve(html);
                });
            }).on('error', function (error) {
                resolve(null)
            });
        })
    },
    fetchHtml: (url) => {
        return fetch(url)
            .then(res => {
                return res.text();
            })
            .catch(error => {
                loggerError(url, error)
                return Promise.resolve(null)
            })
    },
    fetchHtmlPost: (url, body) => {
        return fetch(url, {
            method: 'post',
            body: body
        })
            .then(res => {
                return res.text();
            })
            .catch(error => {
                loggerError(error)
                return Promise.resolve(null)
            })
    },
    requestHtmlPost: (url, body) => {
        var options = {
            method: 'POST',
            url: url,
            formData: body
        };
        return new Promise((resolve, reject) => {
            request(options, function (error, response, body) {
                if (error) {
                    reject(error)
                }
                resolve(body)
            });
        })
    },
    fetchJson: (url) => {
        return fetch(url)
            .then(res => {
                return res.json();
            })
            .catch(error => {
                loggerError(url, error)
                return Promise.resolve(null)
            })
    },
    fetchJsonPost: (url, body,header={}) => {
        return fetch(url, {
            method: 'post',
            body: body,
            headers: header
        })
            .then(res => {
                return res.json();
            })
            .catch(error => {
                loggerError(error)
                return Promise.resolve(null)
            })
    },
}