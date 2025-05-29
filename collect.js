const Puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');
// URLs and selectors
const DEFAULT_URL = 'https://www.attheraces.com/stable-tours';
const CUSTOM_URL_BASE = 'https://jumps.attheraces.com/features/stable-tours';
const TRAINERS_SELECTOR_DEFAULT = 'a[href^="/stable-tours/"].a--plain'; // Default selector
const TRAINERS_SELECTOR_JUMPS = 'a[href^="/features/stable-tours/"].a--plain'; // Jumps page selector
const HORSES_SELECTOR = 'article > div[id^="expandable"] > .panel-content > .push--small:not(.table-wrapper)';
const date = new Date();
const pad = number => number < 10 ? '0' + number : number;
const stringDate = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear() % 2000}`;
// Function to prompt user to choose between default and custom URL
async function getUserInput() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('Do you want to use the default URL or enter a custom one? (D for default, C for custom): ', (answer) => {
            rl.close();
            resolve(answer.trim().toUpperCase());
        });
    });
}
// Function to get the custom URL from the user
async function getCustomUrl() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Please enter the custom URL: ', (url) => {
            rl.close();
            resolve(url.trim());
        });
    });
}
async function init(customUrl) {
    try {
        // Create the output directory if it doesn't exist
        if (!fs.existsSync('./output')) {
            fs.mkdirSync('./output');
        }
        console.log('[+] Launching browser');
        const browser = await Puppeteer.launch({ headless: false });
        console.log('[+] Opened a new browser instance');
        console.log('[+] Opening a new page');
        const page = await browser.newPage();
        console.log('[+] Opened a new page');
        // Set user agent to make it look like a real browser request
        page.setExtraHTTPHeaders({ 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36' });
        console.log('[+] Set user agent for the page');
        // Use the custom URL if provided, otherwise default to the main link
        const targetUrl = customUrl || DEFAULT_URL;
        console.log(`[+] Navigating to the page: ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'networkidle0' });
        console.log(`[+] Navigated to the page: ${targetUrl}`);
        // Determine the selector based on the URL
        let trainersSelector;
        if (targetUrl.startsWith(CUSTOM_URL_BASE)) {
            console.log('[+] Using jumps page trainer selector');
            trainersSelector = TRAINERS_SELECTOR_JUMPS; // Use jumps selector
        } else {
            console.log('[+] Using default page trainer selector');
            trainersSelector = TRAINERS_SELECTOR_DEFAULT; // Use default selector
        }
        console.log('[+] Getting trainers information');
        await page.waitForSelector(trainersSelector, { timeout: 10000 });
        console.log('[+] Found the trainers selector');
        const trainers = await page.$$eval(trainersSelector, elements => elements.map(a => ({
            url: a.href,
            name: a.innerText,
            filename: a.innerText.replace(/[/\\?%*:|"<>]/g, '_') + '.txt'
        })));
        console.log('[+] Extracted the trainers information');
        for (const trainer of trainers) {
            console.log(`[+] Going to ${trainer.name} trainer's page`);
            await page.goto(trainer.url, { waitUntil: 'networkidle0' });
            console.log(`[+] Navigated to ${trainer.name} trainer's page`);
            console.log('[+] Getting horses information');
            try {
                await page.waitForSelector(HORSES_SELECTOR, { timeout: 5000 });
                console.log('[+] Found the horses selector');
                const horseData = await page.$$eval(HORSES_SELECTOR, elements => elements.map((element, index) => {
                    const header = element.parentElement.parentElement.parentElement.children[0].children[0].children[0];
                    const content = element.children[1];
                    const horseName = header ? header.innerText.trim() : '';
                    const formProfile = index % 2 === 0 ? 'Form Profile\n' : '';
                    const trainerSays = content ? content.innerText.trim() : '';
                    return index % 2 === 0 ? `${horseName}\n${formProfile}${trainerSays}\nTrainer says` : `${trainerSays}`;
                }));
                console.log('[+] Extracted the horses information');
                const content = horseData.map((data, index) => `${index % 2 === 0 ? `ATR Stable Tour ${stringDate}\n${data}` : `\n${data}`}`).join('\n');
                console.log('[+] Formatted the horses data');
                console.log(`[+] Writing data to ${trainer.filename}`);
                fs.writeFileSync(`./output/${trainer.filename}`, content);
                console.log(`[+] Wrote data to ${trainer.filename}`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Add a 1-second delay between requests
                console.log('[+] Added a 1-second delay before the next request');
            } catch (e) {
                console.log(`[+] Error getting horses information for trainer ${trainer.name}:`, e);
            }
        }
        await browser.close();
        console.log('[+] Closed the browser');
    } catch (error) {
        console.error('An error occurred during the scraping process:', error);
    }
}
async function retryInit(maxRetries = 3, retryDelay = 5000) {
    let retries = 0;
    const userChoice = await getUserInput();
    let customUrl = null;
    if (userChoice === 'C') {
        customUrl = await getCustomUrl(); // Ask for a custom URL if the user chooses custom
    }
    while (retries < maxRetries) {
        try {
            await init(customUrl); // Pass custom URL if provided
            break;
        } catch (error) {
            retries++;
            console.log(`[+] Retry attempt ${retries}/${maxRetries} failed. Retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}
// Start the script with retry logic
retryInit();