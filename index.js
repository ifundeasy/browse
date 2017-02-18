const dir = __dirname;
const Promise = require('bluebird');
const cheerio = require('cheerio');
const fs = Promise.promisifyAll(require('fs'));
const {execFile} = require('child_process');
const {path} = require('phantomjs');
const uuid = require('node-uuid');
const argv = require('minimist')(process.argv.slice(2));
const url = argv._[0] || argv.url;
const name = argv._[1] || argv.name || url;
const settings = {};
const noFunction = new Function();
const builder = function () {
    const id = uuid.v4();
    const file = {};
    const build = {
        bin: {
            template: `${dir}/template/bin`,
            executable: `${dir}/.temp/${id}-bin`,
            replacement: {
                '{{ FILE }}': `${dir}/.temp/${id}-render`
            }
        },
        render: {
            template: `${dir}/template/render.js`,
            executable: `${dir}/.temp/${id}-render.js`,
            replacement: {
                '{{ URL }}': url
            }
        }
    };
    fs.mkdirAsync(`${dir}/.temp`).catch(noFunction);
    for (let b in build) {
        const el = build[b];
        let content = fs.readFileSync(el.template).toString();
        for (let pattern in el.replacement) {
            const regex = new RegExp(pattern, 'g');
            content = content.replace(regex, el.replacement[pattern]);
        }
        fs.writeFileSync(el.executable, content);
        file[b] = el.executable;
    }
    return {
        id, bin : file.bin,
        remove : function () {
            fs.unlinkSync(build.bin.executable);
            fs.unlinkSync(build.render.executable);
        }
    };
};
const wrap = async function () {
    const Arguments = arguments;
    const args = Object.keys(Arguments).map(function (i) {
        return Arguments[i]
    });
    console.log('Browse', JSON.stringify({name, url, bin: args[0]}));
    return await (new Promise(function (resolve, reject) {
        execFile(path, args, function (err, stdout, stderr) {
            const error = {err, stderr};
            if (err || stderr) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    }));
};

if (!url) {
    console.log('Error: Invalid url');
    process.exit(0);
}

(async function () {
    const file = builder();
    const html = await wrap(file.bin);
    const $ = cheerio.load(html);
    const another = $('[src],[href]');

    await fs.mkdirAsync(`${dir}/static`).catch(noFunction);
    await fs.writeFileAsync(`${dir}/static/${file.id}.html`, html);
    //
    file.remove();
    another.each(function (i, el) {
        const link = $(el).attr('src') || $(el).attr('href');
        console.log(i, link)
    });
})();