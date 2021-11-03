const fs = require('fs');
const client = require('https');

function downloadFile(url, filepath) {
    let dir = `${filepath}`;
    dir = dir.split('/');
    dir.pop();
    !fs.existsSync() && fs.mkdirSync(dir.join('/'), { recursive: true })

    return new Promise((resolve, reject) => {
        client.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                // Consume response data to free up memory
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));

            }
        });
    });
}

module.exports.downloadFile = downloadFile;