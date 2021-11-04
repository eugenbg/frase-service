const { stealth } = require('./libs/stealth');
const { sleep } = require('./libs/sleep');
const { University } = require('./libs/database')


class UniParser {

    page = null;

    async start() {
        this.page = await stealth();

        await University.truncate();

        await this.page.goto('https://www.campuschina.org/universities/index.html');
        await this.page.reload();
        let elements = await this.page.$$('#schoolName li');
        for (const elementPromise of elements) {
            let element = await elementPromise;
            let hrefElem = await element.$('a');
            let link = await hrefElem.getAttribute('href');
            let uniName = await (await element.$('.ellipsis')).innerText();
            let area = await (await element.$('.fr')).innerText();
            await (new University({
                name: uniName,
                link: link,
                region: area,
            })).save();
        }
    }
}


(new UniParser).start().catch(console.error);