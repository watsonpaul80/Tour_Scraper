require('dotenv').config(); // Load environment variables from .env file
const fs = require('fs');
const puppeteer = require('puppeteer');

// Login function to get cookies
async function loginAndGetCookies(page) {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    if (!email || !password) {
        console.error("Email or password is not set in environment variables.");
        process.exit(1);
    }

    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
        console.log(`Attempt ${retries + 1} to login...`);

        await page.goto('https://www.timeform.com/horse-racing/account/sign-in?returnUrl=%2Fhorse-racing%2F');
        await page.waitForSelector('input[name="EmailAddress"]');

        // Clear and type in email and password
        await page.evaluate(() => {
            document.querySelector('input[name="EmailAddress"]').value = "";
            document.querySelector('input[name="Password"]').value = "";
        });
        await page.type('input[name="EmailAddress"]', email, { delay: 100 });
        await page.type('input[name="Password"]', password, { delay: 100 });

        const enteredEmail = await page.$eval('input[name="EmailAddress"]', el => el.value);
        const enteredPassword = await page.$eval('input[name="Password"]', el => el.value);

        if (enteredEmail !== email || enteredPassword !== password) {
            console.error("Failed to enter login credentials correctly. Retrying...");
            retries++;
            await page.waitForTimeout(1000);
            continue;
        }

        await page.click('input[name="RememberMe"]');
        await page.click('input[type="submit"].button.submit-button');

        try {
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
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
            retries++;
            if (retries < maxRetries) {
                console.log(`Retrying login (${retries + 1}/${maxRetries})...`);
                await page.waitForTimeout(2000); 
            } else {
                console.error("Maximum login attempts reached. Exiting.");
                process.exit(1);
            }
        } else {
            console.log("Unexpected issue detected during login. Exiting.");
            process.exit(1);
        }
    }
}

// Retry function for failed to save horses
async function retryFailedToSaveHorses() {
    console.log('Starting retry process for "failed to save" horses...');

    const failedHorsesLog = fs.readFileSync('failed_horses.log', 'utf8')
        .split('\n')
        .filter(line => line.includes('[FAILED TO SAVE]'));

    if (failedHorsesLog.length === 0) {
        console.log('No "failed to save" horses to retry.');
        return;
    }

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const cookies = await loginAndGetCookies(page);
    await page.setCookie(...cookies);

    for (const line of failedHorsesLog) {
        const match = line.match(/\[FAILED TO SAVE\] (.+) \((.+)\)/);
        if (!match) continue;

        const horseName = match[1];
        const trainerName = match[2];
        
        const notesFilePath = `./output/${trainerName.replace(' ', '_')}.txt`;

        console.log(`Retrying save for horse: ${horseName} (Trainer: ${trainerName})`);

        // Prompt for confirmation with y/n
        const retry = await askQuestion(`Do you want to retry for ${horseName} (${trainerName})? (y/n): `);
        
        if (retry.toLowerCase() === 'y') {
            try {
                const fileContent = fs.readFileSync(notesFilePath, 'utf8');
                const horseNotes = extractNotes(fileContent, horseName);

                if (horseNotes) {
                    await updateHorseNotes(page, horseName, trainerName, horseNotes, cookies);
                    console.log(`Successfully updated notes for horse: ${horseName}`);
                } else {
                    console.log(`No notes found for horse: ${horseName}`);
                }
            } catch (error) {
                console.error(`Error updating notes for horse: ${horseName} (Trainer: ${trainerName})`, error);
            }
        } else {
            console.log(`Skipping retry for horse: ${horseName}`);
        }
    }

    await browser.close();
}

// Helper function to prompt the user for y/n input
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

// Helper function to extract notes for a specific horse
function extractNotes(content, horseName) {
    const horseData = content.split('ATR Stable Tour ');
    const horseInfo = horseData.find(info => info.includes(horseName));
    if (!horseInfo) return null;

    const formProfileIndex = horseInfo.indexOf('Form Profile');
    const trainerSaysIndex = horseInfo.indexOf('Trainer says');

    if (formProfileIndex !== -1 && trainerSaysIndex !== -1) {
        const formProfileNotes = horseInfo.slice(formProfileIndex + 'Form Profile'.length, trainerSaysIndex).trim();
        const trainerSaysNotes = horseInfo.slice(trainerSaysIndex + 'Trainer says'.length).trim();
        return `Form Profile\n${formProfileNotes}\n\nTrainer says\n${trainerSaysNotes}`;
    }
    return null;
}

// Function to update horse notes
async function updateHorseNotes(page, horseName, trainerName, horseNotes, cookies) {
    try {
        await page.goto('https://www.timeform.com/horse-racing/');
        await page.waitForSelector('input[type="text"][placeholder="TYPE HERE TO SEARCH"]');
        await page.type('input[type="text"][placeholder="TYPE HERE TO SEARCH"]', horseName);
        await page.waitForSelector('.w-search-results ul li a');

        const searchResults = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.w-search-results ul li a')).map(result => ({
                text: result.textContent.trim(),
                href: result.getAttribute('href')
            }));
        });

        if (searchResults.length === 0) {
            console.log(`No search results found for horse: ${horseName}`);
            return;
        }

        const selectedHorseLink = 'https://www.timeform.com' + searchResults[0].href;
        await page.goto(selectedHorseLink);
        await page.waitForSelector('textarea[data-mytfcontent="1"]', { timeout: 10000 });

        const currentDate = new Date().toLocaleDateString('en-GB');
        const finalNotes = `${currentDate}\n${horseNotes}`;
        await page.evaluate((notes) => {
            document.querySelector('textarea[data-mytfcontent="1"]').value = notes;
        }, finalNotes);

        await page.click('#SaveMyTimeform');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before checking

        console.log(`Notes saved successfully for horse: ${horseName}`);
        fs.appendFileSync('updated_horses.log', `[UPDATED] ${horseName}\n`);
    } catch (error) {
        console.error(`Failed to save notes for horse: ${horseName}`, error);
        fs.appendFileSync('failed_horses.log', `[FAILED TO SAVE] ${horseName} (${trainerName}) - ${error.message}\n`);
    }
}

retryFailedToSaveHorses().catch(console.error);
