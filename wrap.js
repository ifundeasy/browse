const Promise = require('bluebird');
const {execFile} = require('child_process');
const {path} = require('phantomjs');
module.exports = async function () {
    const Arguments = arguments;
    const args = Object.keys(Arguments).map(function (i) {
        return Arguments[i]
    });
    return await (new Promise(function (resolve, reject) {
        execFile(path, args, function (err, stdout, stderr) {
            const error = {err, stderr};
            if (err || stderr) reject(error);
            else reject(stdout);
        });
    }));
};