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

    let retries = 0;
    const maxRetries = 3;

    // Helper function to add a delay
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    while (retries < maxRetries) {
        console.log(`Attempt ${retries + 1} to login...`);

        await page.goto('https://www.timeform.com/horse-racing/account/sign-in?returnUrl=%2Fhorse-racing%2F');

        // Wait for the login form to load
        await page.waitForSelector('input[name="EmailAddress"]');
        
        // Clear the input fields and type with a delay
        await page.evaluate(() => {
            document.querySelector('input[name="EmailAddress"]').value = "";
            document.querySelector('input[name="Password"]').value = "";
        });

        // Type email character by character with a delay
        for (const char of email) {
            await page.type('input[name="EmailAddress"]', char, { delay: 100 });
        }

        // Type password character by character with a delay
        for (const char of password) {
            await page.type('input[name="Password"]', char, { delay: 100 });
        }

        // Verify the input values to ensure they were typed correctly
        const enteredEmail = await page.$eval('input[name="EmailAddress"]', el => el.value);
        const enteredPassword = await page.$eval('input[name="Password"]', el => el.value);

        if (enteredEmail !== email || enteredPassword !== password) {
            console.error("Failed to enter login credentials correctly. Retrying...");
            retries++;
            await delay(1000); // Wait before retrying
            continue;
        }

        // Click the "Remember Me" checkbox and submit the form
        await page.click('input[name="RememberMe"]');
        await page.click('input[type="submit"].button.submit-button');

        try {
            // Wait for navigation to indicate successful login
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
            
            // Check if login was successful by looking for an element available only when logged in
            if (await page.$('a[href="/horse-racing/account/manage"].header-button-left.header-button-1')) {
                console.log("Login successful.");
                return await page.cookies();
            }
        } catch (error) {
            console.warn("Navigation timeout. Checking for error message...");
        }

        // Check if there's an error message indicating incorrect login credentials
        const errorMessage = await page.$eval('.error-message', el => el.innerText).catch(() => null);
        if (errorMessage && errorMessage.includes("The email address or password provided was incorrect")) {
            console.error("Login failed due to incorrect email or password.");
            retries++;
            if (retries < maxRetries) {
                console.log(`Retrying login (${retries + 1}/${maxRetries})...`);
                await delay(2000); 
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
    return lines.find(line => line.trim() !== '' && !/^\d{2}\/\d{2}\/\d{2}$/.test(line) && !line.startsWith('Form Profile') && !line.startsWith('Trainer says'))?.trim() || null;
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
                const horseName = getHorseName(horseInfo);
                const horseNotes = getHorseNotes(horseInfo);

                if (horseName && horseNotes) {
                    let retries = 0;
                    const maxRetries = 3;
                    while (retries < maxRetries) {
                        try {
                            if (horseName.toLowerCase().includes('unnamed')) {
                                console.log(`Skipping unnamed horse: ${horseName}`);
                                break;
                            }
                            await searchAndAddToTracker(currentPage, horseName, trainerName, horseNotes, cookies);
                            await new Promise(resolve => setTimeout(resolve, 2000)); // Delay between horses
                            break;
                        } catch (error) {
                            console.error(`Retry attempt ${retries + 1} failed for horse: ${horseName}. Retrying...`);
                            retries++;
                            await new Promise(resolve => setTimeout(resolve, 5000));
                        }
                    }
                } else {
                    console.log(`Skipping horse due to missing information: ${horseName}`);
                }
            }

            if (fileCount % 7 === 0) {
                pageCount++;
                await currentPage.waitForTimeout(5000);
                await currentPage.close();
                currentPage = await browser.newPage();
                await currentPage.setCookie(...cookies);
            }
        }

        console.log('All files processed. Exiting script.');
        process.exit(0);
    } catch (error) {
        console.error('Error during processing:', error);
        process.exit(1);
    } finally {
        if (currentPage) await currentPage.close();
        await browser.close();
    }
}

async function searchAndAddToTracker(page, horseName, trainerName, horseNotes, cookies) {
    try {
        await page.setCookie(...cookies);
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
            console.log('No search results found.');
            fs.appendFileSync('failed_horses.log', `[NO RESULTS] ${horseName} (${trainerName})\n`);
            return;
        }

        let correctHorseIndex = 0;
        const currentYear = new Date().getFullYear();
        let closestYearDiff = Math.abs(parseInt(searchResults[0].text.match(/\d{4}/)?.[0] || currentYear) - currentYear);

        for (let i = 1; i < searchResults.length; i++) {
            const year = parseInt(searchResults[i].text.match(/\d{4}/)?.[0] || currentYear);
            const yearDiff = Math.abs(year - currentYear);
            if (yearDiff < closestYearDiff) {
                closestYearDiff = yearDiff;
                correctHorseIndex = i;
            }
        }

        const selectedHorseLink = 'https://www.timeform.com' + searchResults[correctHorseIndex].href;
        await page.goto(selectedHorseLink);
        await page.waitForSelector('textarea[data-mytfcontent="1"]', { timeout: 10000 });

        const currentDate = new Date().toLocaleDateString('en-GB');
        const finalNotes = `${currentDate}\n${horseNotes}`;
        await page.evaluate((notes) => {
            document.querySelector('textarea[data-mytfcontent="1"]').value = notes;
        }, finalNotes);

        await page.click('#SaveMyTimeform');
        await page.waitForTimeout(2000);
        await page.reload();

        const savedNotesElement = await page.$('textarea[data-mytfcontent="1"]');
        const savedNotes = savedNotesElement ? await page.evaluate(el => el.value, savedNotesElement) : null;

        if (savedNotes === finalNotes) {
            console.log(`Notes saved successfully for horse: ${horseName}`);
            fs.appendFileSync('updated_horses.log', `[UPDATED] ${horseName}\n`);
            fs.appendFileSync('saved_horses_by_trainer.log', `[SAVED] Trainer: ${trainerName} - Horse: ${horseName}\n`);
        } else {
            console.log(`Failed to save notes for horse: ${horseName}`);
            fs.appendFileSync('failed_horses.log', `[FAILED TO SAVE] ${horseName} (${trainerName})\n`);
        }
    } catch (error) {
        console.error(`Error processing horse: ${horseName}`, error);
        fs.appendFileSync('failed_horses.log', `[ERROR] ${horseName} (${trainerName}) - ${error.message}\n`);
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

runTracker().catch(console.error);
