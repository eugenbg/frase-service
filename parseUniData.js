const { stealth } = require('./libs/stealth');
const { sleep } = require('./libs/sleep');
const { University, UniversityProgram, UniversityScholarship, UniversityImage, UniversityDorm} = require('./libs/database')
const {downloadFile} = require("./libs/file-download");
const {Op} = require("sequelize");

class ParseUniData {

    baseUrl = 'https://www.campuschina.org';
    page = null;

    async start() {
        const startFromUniId = process.argv[2];
        await this.cleanUp(startFromUniId);
        this.page = await stealth();
        let unis;
        if(startFromUniId) {
            unis = await University.findAll({
                where: {
                    id: {
                        [Op.gte]: startFromUniId
                    }
                }
            });
        } else {
            unis = await University.findAll();
        }

        for (const uni of unis) {
            try {
                await this.parseOneUni(uni);
            } catch (e) {
                await sleep(60000);
                await this.parseUniData(uni);
            }
        }
    }

    async parseUniData(uni) {

        await this.getPrograms(uni);//Bachelor

        await Promise.all([
            this.page.waitForResponse(this.isAjaxRequest),
            this.page.click('.sch_tab ul li:has-text("Master")'),
        ]);

        await this.getPrograms(uni, 'Master');

        await Promise.all([
            this.page.waitForResponse(this.isAjaxRequest),
            this.page.click('.sch_tab ul li:has-text("Doctoral")'),
        ]);

        await this.getPrograms(uni, 'Doctoral');

        await Promise.all([
            this.page.waitForResponse(this.isAjaxRequest),
            this.page.click('.sch_tab ul li:has-text("Non-degree")'),
        ]);

        await this.getPrograms(uni, 'No Degree');

        await Promise.all([
            this.page.waitForResponse(this.isAjaxRequest),
            this.page.click('.sch_tab ul li:has-text("Associate")'),
        ]);

        await this.getPrograms(uni, 'Associate');
    }

    isAjaxRequest(response) {
        return response.url().includes('Ajax/AjaxHandler_LXZG.ashx');
    }

    async getPrograms(uni, type = 'Bachelor') {
        const programElements = await this.page.$$('#ajaxUniversitiesPrograms tr');
        const payload = [];
        for (const programElementPromise of programElements) {
            let programNameElement = await (await programElementPromise).$('td >> nth=0');
            let programName = await programNameElement.innerText();

            if(programName.includes('sorry')) { return; } //it means no programs are available

            let programDurationElement = await (await programElementPromise).$('td >> nth=1');
            let programDuration = await programDurationElement.innerText();

            let programLanguageElement = await (await programElementPromise).$('td >> nth=2');
            let programLanguage = await programLanguageElement.innerText();

            let programPriceElement = await (await programElementPromise).$('td >> nth=3');
            let programPrice = await programPriceElement.innerText();

            payload.push({
                'university_id': uni.id,
                'name': programName.trimLeft().trimRight(),
                'language': programLanguage,
                'years': programDuration,
                'price': programPrice,
                'type': type,
            });
        }

        await UniversityProgram.bulkCreate(payload);
    }

    async saveLinkedUniScholarships(uni) {
        const scholarshipElements = await this.page.$$('.scholarShip dd');
        for (const scholarshipElement of scholarshipElements) {
            let element = await scholarshipElement;
            let hrefElem = await element.$('a');
            let link = await hrefElem.getAttribute('href');
            let name = await (await element.$('span')).innerText();

            await (new UniversityScholarship({
                'university_id' : uni.id,
                name: name,
                link: link,
            })).save();
        }
    }

    async savePhotos(uni) {
        const campusImageElements = await this.page.$$('.campusviev img');
        const path = `${__dirname}/assets/images`;
        let payload = [];
        let i = 0;
        for (const imageElementPromise of campusImageElements) {
            i++;
            const imageElement = await imageElementPromise;
            let url = await imageElement.getAttribute('src');
            if(url.includes('..')) { continue; }

            const relativePath = `uni-${uni.id}/campus--${i}.${url.split('.').pop()}`
            let savePath = `${path}/${relativePath}`;

            payload.push({
                university_id: uni.id,
                url: url,
                type: 'campus',
                local_path: relativePath
            });

            await downloadFile(this.baseUrl + url, savePath);
        }

        await UniversityImage.bulkCreate(payload)

        const dormImageElements = await this.page.$$('.swipera20 .device2 img');
        i = 0;
        payload = [];
        for (const imageElementPromise of dormImageElements) {
            i++;
            const imageElement = await imageElementPromise;
            let url = await imageElement.getAttribute('src');
            const relativePath = `uni-${uni.id}/dorm--${i}.${url.split('.').pop()}`
            let savePath = `${path}/${relativePath}`;
            payload.push({
                university_id: uni.id,
                url: url,
                type: 'dorm',
                local_path: relativePath
            });

            await downloadFile(this.baseUrl + url, savePath);
        }
        await UniversityImage.bulkCreate(payload)
    }

    async saveDormRooms(uni) {
        let dormTableElement = (await this.page.$$('.ph_table'))[1];
        if(!dormTableElement) {
            await sleep(5000);
            dormTableElement = (await this.page.$$('.ph_table'))[1];
        }

        const dormTableRows = await dormTableElement.$$('tr');
        let i= 0;
        for (const dormTableRowPromise of dormTableRows) {
            i++;
            if(i === 1) { continue; }
            let roomTypeElement = await (await dormTableRowPromise).$('td >> nth=0');
            let type = await roomTypeElement.innerText();

            let rateElement = await (await dormTableRowPromise).$('td >> nth=1');
            let rate = await rateElement.innerText();

            let toiletElement = await (await dormTableRowPromise).$('td >> nth=2');
            let toilet = await toiletElement.innerText();
            
            let bathroomElement = await (await dormTableRowPromise).$('td >> nth=3');
            let bathroom = await bathroomElement.innerText();

            let internetElement = await (await dormTableRowPromise).$('td >> nth=4');
            let internet = await internetElement.innerText();
            
            let landlineElement = await (await dormTableRowPromise).$('td >> nth=5');
            let landline = await landlineElement.innerText();
            
            let airConditionerElement = await (await dormTableRowPromise).$('td >> nth=6');
            let airConditioner = await airConditionerElement.innerText();
            
            let commentsElement = await (await dormTableRowPromise).$('td >> nth=7');
            let comments = await commentsElement.innerText();

            await (new UniversityDorm({
                'university_id': uni.id,
                type,
                rate,
                toilet,
                bathroom,
                internet,
                landline,
                airConditioner,
                comments,
            })).save();
        }

    }

    async cleanUp(startFromUniId) {
        if(startFromUniId) {
            await UniversityDorm.destroy({
                where: {
                    university_id: {
                        [Op.gte]: startFromUniId
                    }
                }
            });

            await UniversityImage.destroy({
                where: {
                    university_id: {
                        [Op.gte]: startFromUniId
                    }
                }
            });

            await UniversityProgram.destroy({
                where: {
                    university_id: {
                        [Op.gte]: startFromUniId
                    }
                }
            });

            await UniversityScholarship.destroy({
                where: {
                    university_id: {
                        [Op.gte]: startFromUniId
                    }
                }
            });

        }
    }

    async parseOneUni(uni) {
        const url = this.baseUrl + uni.link;
        await this.page.goto(url);
        await this.page.reload();

        await this.parseUniData(uni);
        await this.saveLinkedUniScholarships(uni);
        await this.savePhotos(uni);
        await this.saveDormRooms(uni);
    }
}



(new ParseUniData).start().catch(console.error);