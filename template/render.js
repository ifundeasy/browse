const webpage = require('webpage');
const page = webpage.create();
page.open('{{ URL }}', function(status) {
    if (status !== 'success') {
        console.log('Unable to access network');
    } else {
        const HTML = page.evaluate(function() {
            return document.documentElement.outerHTML
        });
        console.log(HTML);
    }
    phantom.exit();
});