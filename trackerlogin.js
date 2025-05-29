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

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const maxRetries = 3;

    for (let retries = 0; retries < maxRetries; retries++) {
        console.log(`Attempt ${retries + 1} to login...`);

        await page.goto('https://www.timeform.com/horse-racing/account/sign-in?returnUrl=%2Fhorse-racing%2F');
        await page.waitForSelector('input[name="EmailAddress"]');

        await page.evaluate(() => {
            document.querySelector('input[name="EmailAddress"]').value = "";
            document.querySelector('input[name="Password"]').value = "";
        });

        for (const char of email) {
            await page.type('input[name="EmailAddress"]', char, { delay: 100 });
        }

        for (const char of password) {
            await page.type('input[name="Password"]', char, { delay: 100 });
        }

        const enteredEmail = await page.$eval('input[name="EmailAddress"]', el => el.value);
        const enteredPassword = await page.$eval('input[name="Password"]', el => el.value);

        if (enteredEmail !== email || enteredPassword !== password) {
            console.error("Failed to enter login credentials correctly. Retrying...");
            await delay(1000);
            continue;
        }

        await page.click('input[name="RememberMe"]');
        await page.click('input[type="submit"].button.submit-button');

        try {
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
            if (await page.$('a[href="/horse-racing/account/manage"].header-button-left.header-button-1')) {
                console.log("Login successful.");
                return await page.cookies();
            }
        } catch (error) {
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

async function toggleButton(page, buttonSelector) {
    try {
        const isEnabled = await page.$eval(buttonSelector, el => el.classList.contains('alert-btn-enabled'));
        if (!isEnabled) {
            console.log(`Button is disabled. Clicking to enable: ${buttonSelector}`);
            await page.click(buttonSelector); // Click the button to enable it
        } else {
            console.log(`Button is already enabled: ${buttonSelector}`);
        }
    } catch (error) {
        console.error(`Error toggling button: ${buttonSelector} - ${error.message}`);
    }
}

async function prependNotes(page, notesSelector, newNotes) {
    const existingNotes = await page.$eval(notesSelector, el => el.value || '').catch(() => '');
    const updatedNotes = `${newNotes}\n\n${existingNotes}`;
    await page.evaluate((selector, notes) => {
        document.querySelector(selector).value = notes;
    }, notesSelector, updatedNotes.trim());
}

async function searchAndAddToTracker(page, horseName, trainerName, horseNotes, cookies) {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    try {
        await page.setCookie(...cookies);
        await page.goto('https://www.timeform.com/horse-racing/');
        await page.waitForSelector('input[type="text"][placeholder="TYPE HERE TO SEARCH"]');
        await page.type('input[type="text"][placeholder="TYPE HERE TO SEARCH"]', horseName);
        await delay(1000);

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
        await page.goto(selectedHorseLink);
        const notesSelector = 'textarea[data-mytfcontent="1"]';
        await page.waitForSelector(notesSelector, { timeout: 10000 });

        const finalNotes = `${new Date().toLocaleDateString('en-GB')}\n${horseNotes}`;
        await prependNotes(page, notesSelector, finalNotes);

        // Toggle all buttons (Declaration, Evening Before, Race Morning, Result)
        await toggleButton(page, '[data-btn="dec"]');
        await toggleButton(page, '[data-btn="eve"]');
        await toggleButton(page, '[data-btn="morn"]');
        await toggleButton(page, '[data-btn="res"]');

        // Save the notes
        console.log(`Saving notes for horse: ${horseName}`);
        await page.click('#SaveMyTimeform');

        // Verify success
        await page.waitForSelector('.mytf-saved', { timeout: 10000 });
        console.log(`Notes and alerts saved successfully for horse: ${horseName}`);
        fs.appendFileSync('updated_horses.log', `[UPDATED] ${horseName}\n`);
    } catch (error) {
        console.error(`Error processing horse: ${horseName}`, error);
        fs.appendFileSync('failed_horses.log', `[ERROR] ${horseName} (${trainerName}) - ${error.message}\n`);
    }
}

async function readAndAddToTracker(browser, cookies) {
    console.log('Starting readAndAddToTracker function...');
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
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
                        await delay(2000);
                        break;
                    } catch (error) {
                        console.error(`Retry ${retries + 1} failed for horse: ${horseName}. Retrying...`);
                        await delay(5000);
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

runTracker().catch(console.error);