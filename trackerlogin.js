const fs = require('fs');
const puppeteer = require('puppeteer');
require('dotenv').config(); // Load environment variables from .env file

async function loginAndGetCookies(page) {
    await page.goto('https://www.timeform.com/horse-racing/account/sign-in?returnUrl=%2Fhorse-racing%2F');

    // Wait for the login form to load
    await page.waitForSelector('input[name="EmailAddress"]');

    // Fill in the login form
    await page.type('input[name="EmailAddress"]', process.env.EMAIL_ADDRESS);
    await page.type('input[name="Password"]', process.env.PASSWORD);
    await page.click('input[name="RememberMe"]');

    // Submit the login form
    await page.click('input[type="submit"].button.submit-button');

    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Wait for the element that appears after login
    await page.waitForSelector('a[href="/horse-racing/account/manage"].header-button-left.header-button-1');

    console.log("Login successful, 'Manage Account' link detected.");

    // Get cookies after login
    const cookies = await page.cookies();

    // Wait for 60 seconds before proceeding
    console.log("Waiting for 60 seconds...");
    await page.waitForTimeout(60000);

    return cookies;
}

async function runTracker() {
    console.log('Starting runTracker function...');
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Perform login and get cookies
    const cookies = await loginAndGetCookies(page);

    console.log('Login detected, proceeding with the script...');

    // Start the tracker function
    await readAndAddToTracker(browser, cookies);
    console.log('runTracker function completed.');
}

runTracker().catch(console.error);

function getHorseName(content) {
    const lines = content.trim().split('\n');
    const horseName = lines.find(line => line.trim() !== '' && !/^\d{2}\/\d{2}\/\d{2}$/.test(line) && !line.startsWith('Form Profile') && !line.startsWith('Trainer says'));
    return horseName ? horseName.trim() : null;
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
    let currentPage;

    try {
        console.log(`Found ${files.length} files in the output directory.`);
        let fileCount = 0;
        let pageCount = 0;
        currentPage = await browser.newPage();
        await currentPage.setCookie(...cookies);

        for (const file of files) {
            fileCount++;

            console.log(`Processing file (${fileCount}/${files.length}): ${file}`);

            const trainerName = file.replace('.txt', '').replace('_', ' ');
            const fileContent = fs.readFileSync(`./output/${file}`, 'utf8');
            const horseData = fileContent.split('ATR Stable Tour ');

            for (const horseInfo of horseData) {
                console.log(`Horse Info: ${horseInfo}`);
                const horseName = getHorseName(horseInfo);
                const horseNotes = getHorseNotes(horseInfo);

                if (horseName && horseNotes) {
                    console.log(`Trainer Name: ${trainerName}`);
                    console.log(`Horse Name: ${horseName}`);
                    console.log(`Horse Notes: ${horseNotes}`);

                    let retries = 0;
                    const maxRetries = 3;
                    while (retries < maxRetries) {
                        try {
                            if (horseName.toLowerCase().includes('unnamed')) {
                                console.log(`Skipping unnamed horse: ${horseName}`);
                                break;
                            }

                            await searchAndAddToTracker(currentPage, horseName, trainerName, horseNotes, cookies);
                            await new Promise(resolve => setTimeout(resolve, 2000)); // Add a 2-second delay between each horse
                            break; // Break out of the retry loop if successful
                        } catch (error) {
                            console.error(`Retry attempt ${retries + 1} failed for horse: ${horseName}. Retrying...`);
                            retries++;
                            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
                        }
                    }
                } else {
                    console.log(`Skipping horse due to missing information: ${horseName}`);
                }
            }

            if (fileCount % 7 === 0) {
                pageCount++;
                console.log(`Closing current page and opening a new one (Page ${pageCount})...`);
                await currentPage.waitForTimeout(5000);
                await currentPage.close();
                currentPage = await browser.newPage();
                await currentPage.setCookie(...cookies);
            }
        }

        console.log('All files have been processed. Exiting the script.');
        process.exit(0); // Exit the script with a success status code
    } catch (error) {
        console.error('An error occurred during processing:', error);
        process.exit(1); // Exit the script with an error status code
    } finally {
        if (currentPage) {
            console.log('Closing the last page...');
            await currentPage.close();
        }
        console.log('Closing the browser...');
        await browser.close();
        console.log('Browser closed.');
    }
}
async function searchAndAddToTracker(page, horseName, trainerName, horseNotes, cookies) {
    try {
        await page.setCookie(...cookies);
        await page.goto('https://www.timeform.com/horse-racing/');
        console.log(`Searching for horse: ${horseName}`);
        await page.waitForSelector('input[type="text"][placeholder="TYPE HERE TO SEARCH"]');
        await page.type('input[type="text"][placeholder="TYPE HERE TO SEARCH"]', horseName);
        await page.waitForSelector('.w-search-results ul li a');

        const searchResults = await page.evaluate(() => {
            const results = Array.from(document.querySelectorAll('.w-search-results ul li a'));
            return results.map(result => ({
                text: result.textContent.trim(),
                href: result.getAttribute('href')
            }));
        });

        if (searchResults.length === 0) {
            console.log('No search results found for the given horse name.');
            return;
        }

        console.log('Search Results:');
        searchResults.forEach((result, index) => {
            console.log(`${index + 1}. ${result.text}`);
        });

        let correctHorseIndex = 0;

        if (searchResults.length > 1) {
            const currentYear = new Date().getFullYear();
            let closestYearDiff = Math.abs(parseInt(searchResults[0].text.match(/\d{4}/)[0]) - currentYear);

            for (let i = 1; i < searchResults.length; i++) {
                const year = parseInt(searchResults[i].text.match(/\d{4}/)[0]);
                const yearDiff = Math.abs(year - currentYear);

                if (yearDiff < closestYearDiff) {
                    closestYearDiff = yearDiff;
                    correctHorseIndex = i;
                }
            }
        }

        const selectedHorseLink = 'https://www.timeform.com' + searchResults[correctHorseIndex].href;
        console.log(`Opening URL: ${selectedHorseLink}`);
        await page.goto(selectedHorseLink);
        console.log('Navigated to the horse details page successfully.');

        // Wait for the textarea to be available
        await page.waitForSelector('textarea[data-mytfcontent="1"]', { timeout: 10000 });
        console.log('Notes textarea loaded successfully.');

        const currentDate = new Date().toLocaleDateString('en-GB');
        const existingNotesElement = await page.$('textarea[data-mytfcontent="1"]');
        const existingNotes = existingNotesElement ? await page.evaluate(el => el.value, existingNotesElement) : null;

        let finalNotes = `${currentDate}\n${horseNotes}`;
        if (existingNotes) {
            finalNotes = `${currentDate}\n${horseNotes}\n\n${existingNotes}`;
        }

        // Click on the buttons
        const buttonSelectors = [
            '[data-btn="dec"]',
            '[data-btn="eve"]',
            '[data-btn="morn"]',
            '[data-btn="res"]'
        ];

        for (const selector of buttonSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 5000 });
                await page.click(selector);
                console.log(`Clicked button: ${selector}`);
            } catch (error) {
                console.error(`Failed to click button: ${selector}`);
            }
        }

        await page.evaluate((finalNotes) => {
            document.querySelector('textarea[data-mytfcontent="1"]').value = finalNotes;
        }, finalNotes);
        console.log('Notes updated in the text area.');

        console.log(`Saving notes for horse: ${horseName}`);
        await page.click('#SaveMyTimeform');
        console.log('Save button clicked.');

        // Wait for a short delay to allow the save operation to complete
        await page.waitForTimeout(2000);

        // Reload the page to check if the notes were saved successfully
        await page.reload();
        console.log('Page reloaded after saving notes.');

        // Check if the saved notes match the expected notes
        const savedNotesElement = await page.$('textarea[data-mytfcontent="1"]');
        const savedNotes = savedNotesElement ? await page.evaluate(el => el.value, savedNotesElement) : null;
        console.log('Saved notes:', savedNotes);

        if (savedNotes === finalNotes) {
            console.log(`Notes saved successfully for horse: ${horseName}`);
            console.log(`Added ${horseName} (${trainerName}) to your tracker.`);

            // Log the updated horse name to a file
            fs.appendFileSync('updated_horses.log', `[UPDATED] ${horseName} (Trainer: ${trainerName})\n`);
        } else {
            console.log(`Failed to save notes for horse: ${horseName}`);

            // Log the failed horse name to a file
            fs.appendFileSync('updated_horses.log', `[FAILED] ${horseName} (Trainer: ${trainerName})\n`);
        }
    } catch (error) {
        console.error(`An error occurred while processing horse: ${horseName}`, error);

        // Log the failed horse name to a file
        fs.appendFileSync('updated_horses.log', `[FAILED] ${horseName} (Trainer: ${trainerName})\n`);
    }
}

async function askQuestion(question) {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => {
        readline.question(question, answer => {
            resolve(answer);
            readline.close();
        });
    });
}
