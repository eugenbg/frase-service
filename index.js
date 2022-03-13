const {stealth} = require('./libs/stealth');
const {sleep} = require('./libs/sleep');
const {Keyword, Piece, sequelize} = require('./libs/database')
const { QueryTypes } = require('sequelize');
const { chromium } = require("playwright");
const tmp = require('tmp-promise');


class FraseParser {

    username = 'gwsezlgpvsuemzhhoxfmmovgodabeg';
    password = '9SftL@djDJzW5gL';

    page = null;

    async start() {
        await this.login();
        const keywords = await this.getKeywords();
        for (const keyword of keywords) {
            try {
                await this.processKeyword(keyword);
            } catch (e) {
                console.log(e.message);
                return;
            }
        }
    }

    async login() {
        const userDataDir = `/tmp/test-user-data-${Math.random()}`
        let extensionURL;
        let extPath = __dirname + '/extensions/toolsurf';

        const browserContext = (await chromium.launchPersistentContext(userDataDir, {
            headless: false,
            args: [
                // Follow suggestions on https://playwright.dev/docs/ci#docker
                `--disable-extensions-except=${extPath}`,
                `--load-extension=${extPath}`,
            ],
        }));

        this.page = await browserContext.newPage();
/*
        await this.page.route('**!/!*', (route) => {
            const url = route.request().url();
            if(url.includes('beamer')) {
                return route.abort();
            } else {
                return route.fulfill();
            }
        });
*/

        await this.page.goto('https://tools.toolsurf.com/login');
        await this.page.type('#amember-login', this.username);
        await this.page.type('#amember-pass', this.password);
        const backgroundPage = browserContext.backgroundPages()[0];
        const url = backgroundPage.url()
        const [, , extensionId] = url.split('/')
        extensionURL = `chrome-extension://${extensionId}/views.html?view=popup`
        await this.page.goto(extensionURL);
        await this.page.waitForSelector('#buttonID_0');
        await sleep(1000);
        const [newPage] = await Promise.all([
            browserContext.waitForEvent('page'),
            this.page.click('#buttonID_0'),
            this.page.click('#buttonID_0'),
        ])

        await newPage.waitForSelector('#create-doc-button');
        this.page = newPage;
    }

    async getKeywords() {
        return await sequelize.query(
            "SELECT keywords.* FROM keywords left join pieces p on keywords.id = p.keyword_id\n" +
            "group by keywords.id\n" +
            "having count(p.id) = 0",
            { type: QueryTypes.SELECT }
        );
    }

    async processKeyword(keyword) {
        await this.page.click('#create-doc-button');
        await this.page.waitForSelector('#new-doc-query');
        await this.page.type('#new-doc-query input', keyword.keyword);
        await this.page.click('.brand-button.brand-bg-color.ng-scope');
        await this.page.waitForSelector('#doc-search-serp a.brand-button.brand-bg-color');
        await this.page.click('#doc-search-serp a.brand-button.brand-bg-color');
        await this.page.waitForSelector('.right-panel-row.pointer', {timeout: 60000});
        const pieceContainers = await this.page.$$('.right-panel-row.pointer');
        let payload = [];
        for (const pieceContainer of pieceContainers) {
            let heading = await pieceContainer.innerText();
            heading = heading.replace(/h\d\n/i, '').trim()
            await pieceContainer.click();
            await pieceContainer.waitForSelector('div');
            let content = await (await pieceContainer.$('div')).innerText();
            content = content.replace('\nPaste Summarize Rewrite', '');
            payload.push({
                keyword_id: keyword.id,
                heading,
                content,
            });
        }

        await Piece.bulkCreate(payload);
        try {
            await this.page.goto('https://app.frase.io/app/dashboard/documents');
        } catch (e) {
            await this.page.goto('https://app.frase.io/app/dashboard/documents');
        }
    }
}


(new FraseParser).start().catch(console.error);