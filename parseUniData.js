const { stealth } = require('./libs/stealth');
const { sleep } = require('./libs/sleep');
const { University, UniversityProgram, UniversityScholarship, UniversityImage } = require('./libs/database')

class ParseUniData {

    page = null;

    async parseUniData(uni) {
        console.log('parseUniData')
        const url = 'https://www.campuschina.org' + uni.link;
        await this.page.goto(url);
        await this.page.reload();

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

    async start() {
        console.log('start')
        this.page = await stealth();
        let unis = await University.findAll();
        for (const uni of unis) {
            await this.parseUniData(uni);
            await this.saveLinkedUniScholarships(uni);
            await this.savePhotos(uni);
        }

    }

    async getPrograms(uni, type = 'Bachelor') {
        return;
        const programElements = await this.page.$$('#ajaxUniversitiesPrograms tr')
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

            await (new UniversityProgram({
                'university_id': uni.id,
                'name': programName,
                'language': programLanguage,
                'years': programDuration,
                'price': programPrice,
                'type': type,
            })).save();
        }
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
        for (const imageElementPromise of campusImageElements) {
            const imageElement = await imageElementPromise;
            let url = await imageElement.getAttribute('src');

            await (new UniversityImage({
                university_id: uni.id,
                url: url,
                type: UniversityImage.TYPE_CAMPUS
            })).save()
        }
    }
}



(new ParseUniData).start().catch(console.error);