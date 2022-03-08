const {stealth} = require('./libs/stealth');
const {sleep} = require('./libs/sleep');
const {Keyword, Piece, sequelize} = require('./libs/database')
const { QueryTypes } = require('sequelize');


class FraseParser {

    username = 'eugen.bogdanovich+3@gmail.com';
    password = '111111Ab';

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
        this.page = await stealth();
        await this.page.goto('https://app.frase.io/login');
        await this.page.type('#username', this.username);
        await this.page.type('#password', this.password);
        await this.page.click('#login-page-wrapper input[type="submit"]');
        await this.page.waitForSelector('#create-doc-button');
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
        await this.page.waitForSelector('.right-panel-row.pointer');
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
        await this.page.goto('https://app.frase.io/app/dashboard/documents');
    }
}


(new FraseParser).start().catch(console.error);