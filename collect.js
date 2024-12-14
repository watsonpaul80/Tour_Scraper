const fs = require('fs');
const puppeteer = require('puppeteer');
require('dotenv').config();

async function loginAndGetCookies(page) {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    if (!email || !password) {
        console.error("Email or password is not set in environment variables.");
        process.exit(1);
    }

    const maxRetries = 3;

    for (let retries = 0; retries < maxRetries; retries++) {
        console.log(`Attempt ${retries + 1} to login...`);

        await page.goto('https://www.timeform.com/horse-racing/account/sign-in?returnUrl=%2Fhorse-racing%2F');
        await page.waitForSelector('input[name="EmailAddress"]');

        await page.evaluate(() => {
            document.querySelector('input[name="EmailAddress"]').value = "";
            document.querySelector('input[name="Password"]').value = "";
        });

        await page.type('input[name="EmailAddress"]', email);
        await page.type('input[name="Password"]', password);

        await page.click('input[name="RememberMe"]');
        await page.click('input[type="submit"].button.submit-button');

        try {
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
            if (await page.$('a[href="/horse-racing/account/manage"].header-button-left.header-button-1')) {
                console.log("Login successful.");
                return await page.cookies();
            }
        } catch {
            console.warn("Navigation timeout. Checking for error message...");
        }

        const errorMessage = await page.$eval('.error-message', el => el.innerText).catch(() => null);
        if (errorMessage && errorMessage.includes("The email address or password provided was incorrect")) {
            console.error("Login failed due to incorrect email or password.");
            if (retries + 1 === maxRetries) {
                console.error("Maximum login attempts reached. Exiting.");
                process.exit(1);
            }
        } else {
            console.error("Unexpected issue detected during login. Exiting.");
            process.exit(1);
        }
    }
}

async function runTracker() {
    console.log('Starting runTracker function...');
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    const cookies = await loginAndGetCookies(page);

    console.log('Login detected, proceeding with the script...');
    await readAndAddToTracker(browser, cookies);
    console.log('runTracker function completed.');
}

function getHorseName(content) {
    const lines = content.trim().split('\n');
    return lines.find(line => line.trim() && !/^\d{2}\/\d{2}\/\d{2}$/.test(line) && !line.startsWith('Form Profile') && !line.startsWith('Trainer says'))?.trim() || null;
}

function getHorseNotes(content) {
    const formProfileIndex = content.indexOf('Form Profile');
    const trainerSaysIndex = content.indexOf('Trainer says');
    if (formProfileIndex !== -1 && trainerSaysIndex !== -1) {
        const formProfileNotes = content.slice(formProfileIndex + 'Form Profile'.length, trainerSaysIndex).trim();
        const trainerSaysNotes = content.slice(trainerSaysIndex + 'Trainer says'.length).trim();
        return `Form Profile\n${formProfileNotes}\n\nTrainer says\n${trainerSaysNotes}`;
    }
    return null;
}

async function readAndAddToTracker(browser, cookies) {
    console.log('Starting readAndAddToTracker function...');
    const files = fs.readdirSync('./output');
    console.log(`Found ${files.length} files in the output directory.`);

    let currentPage = await browser.newPage();
    await currentPage.setCookie(...cookies);

    for (const file of files) {
        console.log(`Processing file: ${file}`);
        const trainerName = file.replace('.txt', '').replace('_', ' ');
        const fileContent = fs.readFileSync(`./output/${file}`, 'utf8');
        const horseData = fileContent.split('ATR Stable Tour ');

        for (const horseInfo of horseData) {
            const horseName = getHorseName(horseInfo);
            const horseNotes = getHorseNotes(horseInfo);

            if (horseName && horseNotes) {
                for (let retries = 0; retries < 3; retries++) {
                    try {
                        if (horseName.toLowerCase().includes('unnamed')) {
                            console.log(`Skipping unnamed horse: ${horseName}`);
                            break;
                        }
                        await searchAndAddToTracker(currentPage, horseName, trainerName, horseNotes, cookies);
                        break;
                    } catch (error) {
                        console.error(`Retry ${retries + 1} failed for horse: ${horseName}. Retrying...`);
                    }
                }
            } else {
                console.log(`Skipping horse due to missing information: ${horseName}`);
            }
        }
    }

    await currentPage.close();
    await browser.close();
    console.log('All files processed. Exiting script.');
}

async function searchAndAddToTracker(page, horseName, trainerName, horseNotes, cookies) {
    // Helper to generate random delays (300ms to 800ms)
    const randomDelay = () => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 500) + 300));

    try {
        await page.setCookie(...cookies);

        // Navigate to the search page
        await page.goto('https://www.timeform.com/horse-racing/');
        await page.waitForSelector('input[type="text"][placeholder="TYPE HERE TO SEARCH"]');

        console.log(`Searching for horse: ${horseName}`);
        await page.type('input[type="text"][placeholder="TYPE HERE TO SEARCH"]', horseName);
        await randomDelay(); // Random delay after typing

        await page.waitForSelector('.w-search-results ul li a', { timeout: 5000 });

        const searchResults = await page.evaluate(() =>
            Array.from(document.querySelectorAll('.w-search-results ul li a')).map(result => ({
                text: result.textContent.trim(),
                href: result.getAttribute('href'),
            }))
        );

        if (searchResults.length === 0) {
            console.log(`No search results found for: ${horseName}`);
            fs.appendFileSync('failed_horses.log', `[NO RESULTS] ${horseName} (${trainerName})\n`);
            return;
        }

        const selectedHorseLink = 'https://www.timeform.com' + searchResults[0].href;
        console.log(`Clicking horse link for: ${horseName}`);
        await page.goto(selectedHorseLink);
        await randomDelay(); // Random delay after navigation

        // Wait for the notes field
        console.log(`Filling in notes for horse: ${horseName}`);
        const notesSelector = 'textarea[data-mytfcontent="1"]';
        await page.waitForSelector(notesSelector, { timeout: 10000 });

        const finalNotes = `${new Date().toLocaleDateString('en-GB')}\n${horseNotes}`;
        await page.evaluate((notes, selector) => {
            const textarea = document.querySelector(selector);
            textarea.value = notes;
        }, finalNotes, notesSelector);

        console.log(`Saving notes for horse: ${horseName}`);
        await randomDelay(); // Random delay before clicking save
        await page.click('#SaveMyTimeform');

        // Wait for the save confirmation element
        const saveConfirmationSelector = '.mytf-saved';
        try {
            await page.waitForSelector(saveConfirmationSelector, { timeout: 10000 });
            const saveMessage = await page.$eval(saveConfirmationSelector, el => el.textContent.trim());
            console.log(`Save confirmation received: "${saveMessage}" for horse: ${horseName}`);
            fs.appendFileSync('updated_horses.log', `[UPDATED] ${horseName}\n`);
        } catch (error) {
            console.error(`Save confirmation not found for horse: ${horseName}`);
            fs.appendFileSync('failed_horses.log', `[FAILED TO SAVE CONFIRMATION] ${horseName} (${trainerName})\n`);
        }
    } catch (error) {
        console.error(`Error processing horse: ${horseName}`, error);
        fs.appendFileSync('failed_horses.log', `[ERROR] ${horseName} (${trainerName}) - ${error.message}\n`);
    }
}

runTracker().catch(console.error);
