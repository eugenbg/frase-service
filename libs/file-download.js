const http = require('http');
const fs = require('fs');

async function downloadFile(url, savePath) {
    const request = http.get(url, function(response) {
        if (response.statusCode === 200) {
            let file = fs.createWriteStream(savePath);
            response.pipe(file);
        }
        request.setTimeout(20000, function() {
            request.abort();
        });
    });
}

