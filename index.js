const {stealth} = require('./libs/stealth');
const {sleep} = require('./libs/sleep');
const {Keyword, Piece, sequelize, Serp} = require('./libs/database')
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
                await this.processKeyword(keyword);
            }
        }
    }

    async login() {
        const userDataDir = `/tmp/test-user-data-${Math.random()}`

        const browserContext = (await chromium.launchPersistentContext(userDataDir, {
            headless: false,
            args: [],
        }));

        this.page = await browserContext.newPage();

        await this.page.goto('https://tools.toolsurf.com/login');
        await this.page.type('#inputEmail', this.username);
        await this.page.type('#inputPassword', this.password);

        await this.page.waitForSelector('.prybtn');
        await this.page.goto('https://tools.toolsurf.com/page/frase');

        try {
            await this.page.goto('https://fra.toolsurf.com/app/dashboard/documents', {timeout: 60000});
            await this.page.waitForSelector('#create-doc-button', {timeout: 60000});
        } catch (e) {
            await this.page.goto('https://fra.toolsurf.com/app/dashboard/documents', {timeout: 60000});
            await this.page.waitForSelector('#create-doc-button', {timeout: 60000});
        }
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
        console.log('starting to process keyword ' + keyword.keyword);
        try {
            try {
                await this.page.goto('https://fra.toolsurf.com/app/dashboard/documents', {timeout: 60000});
                await this.page.waitForSelector('#create-doc-button', {timeout: 60000});
            } catch (e) {
                await this.page.goto('https://fra.toolsurf.com/app/dashboard/documents', {timeout: 60000});
                await this.page.waitForSelector('#create-doc-button', {timeout: 60000});
            }

            await this.page.click('#create-doc-button');
            await this.page.waitForSelector('#new-doc-query');
            await this.page.type('#new-doc-query input', keyword.keyword);
            await this.page.click('.brand-button.brand-bg-color.ng-scope');
            await this.page.waitForSelector('#doc-search-serp a.brand-button.brand-bg-color', {timeout: 120000});
            await this.page.click('#doc-search-serp a.brand-button.brand-bg-color');


            await this.page.waitForSelector('.document-search-item', {timeout: 120000});
            let searchResultElements = await this.page.$$('.document-search-item');
            let payload = [];

            for (const searchResultElement of searchResultElements) {
                try {
                    let serpLinkElement = await searchResultElement.$('.document-search-item-meta a');
                    const titleElement = await searchResultElement.$('h2');
                    const title = await titleElement.innerText();
                    let url = await serpLinkElement.getAttribute('href');
                    const metadataElement = await searchResultElement.$('.document-search-item-meta:nth-child(2)');
                    let position = await this.getMetaParam('Ranking', metadataElement);
                    let da = await this.getMetaParam('DA', metadataElement);
                    let linksQty = await this.getMetaParam('Links', metadataElement);
                    let serpModel = new Serp();
                    serpModel.keyword_id = keyword.id;
                    serpModel.url = url;
                    serpModel.da = da ? da : 0;
                    serpModel.links = linksQty ? linksQty : 0;
                    serpModel.position = position;
                    serpModel.title = title;
                    serpModel = await serpModel.save();
                    const pieceContainers = await searchResultElement.$$('.right-panel-row.pointer');
                    let i = 0;
                    for (const pieceContainer of pieceContainers) {
                        i++;
                        let heading = await pieceContainer.innerText();
                        heading = heading.replace(/h\d\n/i, '').trim().substring(0, 255);
                        await pieceContainer.click();
                        await pieceContainer.waitForSelector('div');
                        let content = await (await pieceContainer.$('div')).innerText();
                        content = content.replace('Paste Summarize Rewrite', '');
                        payload.push({
                            serp_id: serpModel.id,
                            keyword_id: keyword.id,
                            position: i,
                            heading,
                            content,
                        });
                    }
                } catch (e) {
                    //ignore this piece
                }

            }
            await Piece.bulkCreate(payload);
        } catch (e) {
            await this.processKeyword(keyword);
        }
    }

    async getMetaParam(metric, parent) {
        let elements = await parent.$$('span');
        for (const element of elements) {
            let text = await element.innerText();
            let pattern = `${metric}: #?(\\d*)`;
            let matches = text.match((new RegExp(pattern)));
            if(matches && matches.length > 0) {
                return matches[1];
            }
        }

        return '';
    }
}


(new FraseParser).start().catch(console.error);