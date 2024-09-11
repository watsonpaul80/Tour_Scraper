const fs = require('fs');
const puppeteer = require('puppeteer');

async function readAndAddToTracker(browser) {
    console.log('Starting readAndAddToTracker function...');
    const files = fs.readdirSync('./output');
    let currentPage;

    try {
        console.log(`Found ${files.length} files in the output directory.`);
        let fileCount = 0;
        let pageCount = 0;
        currentPage = await browser.newPage();

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

                            await searchAndAddToTracker(currentPage, horseName, trainerName, horseNotes, askQuestion);
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

async function runTracker() {
    console.log('Starting runTracker function...');
    const browser = await puppeteer.launch();
    await readAndAddToTracker(browser);
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

async function searchAndAddToTracker(page, horseName, trainerName, horseNotes, askQuestion) {
    try {
        // Set cookies here
        await page.setCookie(
            // Your cookie objects here
            { name: '.AspNet.ApplicationCookie', value: 'O70QPkteZwYTQ2L_KMc2zQg9nFUTBBsQneCE7b7qmKuJoaBtwn_ZohNDqsMXkqc-D97hGujr8EGIeZNdwsNjaBIGVelxo3bzQrQamQnqPmSDaxG4vpsN-966BRF37pGuowQPsDQMeh-skUSo7WtjwGqHWY6br95U9C_p7J9S1F5XE4qf21QRNAgOjQdVlQE2PsS9QVSCmnNzSZRY-N0QuiKZD9rc3IW70TSZ8rJvcVUizkdrHfRuarZRG94Ow0_VBcqa4umxT4IkQaVJfEXf4Dgwf_gbTOWTDzusLkFs6CKvR7dUSzinfdgHmI5tINACrRQiv_tLqQ-9Rsxnrxee2Fz59mVLeg5Grb6n0ElsO5YKye6FNK92A7tQPubVRu2oITNkwlHU0rsqgj600TcToQv98_JpCg1RfOO2eQBgC3pZHb1Mb85xrdwTCdNQYjOSFrKtAg', domain: '.timeform.com' },
            { name: '8822bf0968f987766d394fcb39b3e1e02adf468ae02eb0e7287c47abc373715c', value: '', domain: '.www.timeform.com' },
            { name: 'ASLBSA', value: '00039a14c7071f248ca3a50fc96afcd0009f273e0acbdf19793a836aa4dbd2f0b51d', domain: 'www.timeform.com' },
            { name: 'ASLBSACORS', value: '00039a14c7071f248ca3a50fc96afcd0009f273e0acbdf19793a836aa4dbd2f0b51d', domain: 'www.timeform.com' },
            { name: 'ASP.NET_SessionId', value: 'sl0pvnmecdld0b1rufzqop5g', domain: 'www.timeform.com' },
            { name: 'OptanonAlertBoxClosed', value: '2024-06-12T08:04:07.015Z', domain: '.timeform.com' },
            { name: 'OptanonConsent', value: 'isGpcEnabled=0&datestamp=Mon+Jun+17+2024+10%3A04%3A57+GMT%2B0100+(British+Summer+Time)&version=6.39.0&isIABGlobal=false&hosts=&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0004%3A1&geolocation=%3B&AwaitingReconsent=false', domain: '.timeform.com' },
            { name: 'TFM', value: 'DeviceId=d9261ec6-5263-4958-abcf-70bc354fb184', domain: 'www.timeform.com' },
            { name: '__RequestVerificationToken_L2hvcnNlLXJhY2luZw2', value: 'u9iabNvyj4LvUTRp52xgPRf5GIluLygZ24Zo1xTgrE0GpqgLBrc5leLmNIP4rOa0pJZq4g_0tVTUJGakB6Hg5rCRC1o1', domain: 'www.timeform.com' }
        );
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
            fs.appendFileSync('updated_horses.log', `[UPDATED] ${horseName}\n`);
        } else {
            console.log(`Failed to save notes for horse: ${horseName}`);

            // Log the failed horse name to a file
            fs.appendFileSync('updated_horses.log', `[FAILED] ${horseName}\n`);
        }
    } catch (error) {
        console.error(`An error occurred while processing horse: ${horseName}`, error);

        // Log the failed horse name to a file
        fs.appendFileSync('updated_horses.log', `[FAILED] ${horseName}\n`);
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