let fs = require('fs');
const {Keyword} = require('./libs/database');


(async function() {

    let array = fs.readFileSync('unis.txt').toString().split("\n");

    for(i in array) {
        await (new Keyword({
            keyword : array[i] + ' scholarships',
            type : 'university',
            country : 'uk',
        })).save();
    }

    array = fs.readFileSync('colleges.txt').toString().split("\n");

    for(i in array) {
        await (new Keyword({
            keyword : array[i] + ' scholarships',
            type : 'college',
            country : 'uk',
        })).save();
    }

})();

