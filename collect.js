const Puppeteer = require('puppeteer');
const fs = require('fs');

const INDEX_PAGE = 'https://www.attheraces.com/stable-tours';
const TRAINERS_SELECTOR = 'a[href^="/stable-tours/"].a--plain';
const HORSES_SELECTOR = 'article > div[id^="expandable"] > .panel-content > .push--small:not(.table-wrapper)';

const date = new Date();
const pad = number => number < 10 ? '0' + number : number;
const stringDate = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear() % 2000}`;

async function init() {
    try {
        // Create the output directory if it doesn't exist
        if (!fs.existsSync('./output')) {
            fs.mkdirSync('./output');
        }

        console.log('[+] Launching browser');
        const browser = await Puppeteer.launch();
        console.log('[+] Opening a page');
        const page = await browser.newPage();
        page.setExtraHTTPHeaders({'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36'});
        console.log('[+] Going to ATR Stable Tours');
        await page.goto(INDEX_PAGE);
        console.log('[+] Getting trainers information');
        await page.waitForSelector(TRAINERS_SELECTOR);
        const trainers = await page.$$eval(TRAINERS_SELECTOR, elements => elements.map(a => ({
            url: a.href,
            name: a.innerText,
            filename: a.innerText.split(' ').join('_') + '.txt'
        })));

        for (const trainer of trainers) {
            console.log(`[+] Going to ${trainer.name} trainer's page`);
            await page.goto(trainer.url, { waitUntil: 'networkidle0' });
            console.log('[+] Getting horses information');
            try {
                await page.waitForSelector(HORSES_SELECTOR, { timeout: 5000 });
                const horseData = await page.$$eval(HORSES_SELECTOR, elements => elements.map((element, index) => {
                    const header = element.parentElement.parentElement.parentElement.children[0].children[0].children[0];
                    const content = element.children[1];
                    const horseName = header ? header.innerText.trim() : '';
                    const formProfile = index % 2 === 0 ? 'Form Profile\n' : '';
                    const trainerSays = content ? content.innerText.trim() : '';
                    return index % 2 === 0 ? `${horseName}\n${formProfile}${trainerSays}` : `Trainer says\n${trainerSays}`;
                }));

                const content = horseData.map((data, index) => `ATR Stable Tour ${stringDate}\n${data}${index % 2 === 1 ? '\n\n' : ''}`).join('');
                fs.writeFileSync(`./output/${trainer.filename}`, content);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Add a 1-second delay between requests
            } catch (e) {
                console.log(`[+] Error getting horses information for trainer ${trainer.name}:`, e);
            }
        }

        await browser.close();
    } catch (error) {
        console.error('An error occurred during the scraping process:', error);
    }
}

async function retryInit(maxRetries = 3, retryDelay = 5000) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            await init();
            break;
        } catch (error) {
            retries++;
            console.log(`Retry attempt ${retries}/${maxRetries} failed. Retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}

retryInit();