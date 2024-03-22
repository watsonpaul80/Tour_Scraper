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
    } else if (formProfileIndex !== -1) {
        const formProfileNotes = content.slice(formProfileIndex + 'Form Profile'.length).trim();
        return `Form Profile\n${formProfileNotes}`;
    } else if (trainerSaysIndex !== -1) {
        const trainerSaysNotes = content.slice(trainerSaysIndex + 'Trainer says'.length).trim();
        return `Trainer says\n${trainerSaysNotes}`;
    }

    return null;
}

async function searchAndAddToTracker(page, horseName, trainerName, horseNotes, askQuestion) {
    try {
        // Set cookies here
        await page.setCookie(
            // Your cookie objects here
            { name: '.AspNet.ApplicationCookie', value: 'vkwE8ANOrPFEcWEcyJWzxWOB1ZskuOjErsvcvEFg0GDdOkiRcHmxmfHChvP8hx8osdOyiMTSL1navK4TXdFQgti6Ad7YISo-EuGV7Em_Xs6lCFE3CzrJdILTEwjMoH8zRnu_9R1gvuD-J6bSHJwsdcqpeba-67dVqWsXoloxolqmBZtk5Tr3UEdz15EaFBVr88z24-vy-Re8u1nol3JbevHGdlqzkLaauSGjBTrQk-EWiZDBCWBSFPj4WVDA4jrwwO_ATndksFnimM3PJ3fyd7CcQUseJDeR0xUU495IvvNG40xcKEuj2-t1c6TW15WL9HXdkPdAuMLaM46QmmpCjfdHIAUZ50Q1_12Br4rd4XpRhbaLONWG3RPSBS41KPuK2qSTYC318JeiU_OKpV_ymHtn-IO-M_fqGBqHP2P7GNttesvNEyfRKfEuOtXmjfq2f2qPfg', domain: '.timeform.com' },
            { name: 'ARRAffinitya340a76e318606afba243e3c7f38ee20153cebf13a5a2b2a1bc42681bae64418', value: '', domain: '.www.timeform.com' },
            { name: 'ASLBSA', value: '0003326263ba1948e6760915b34882bd1301e13eb52bf8650bf28e131726fced5573b3f387a83ed7db73687a5ef56f408e0a973d676d868376fd7538bf20ec581f309a14c7071f248ca3a50fc96afcd0009f273e0acbdf19793a836aa4dbd2f0b51d', domain: 'www.timeform.com' },
            { name: 'ASLBSACORS', value: '0003326263ba1948e6760915b34882bd1301e13eb52bf8650bf28e131726fced5573b3f387a83ed7db73687a5ef56f408e0a973d676d868376fd7538bf20ec581f309a14c7071f248ca3a50fc96afcd0009f273e0acbdf19793a836aa4dbd2f0b51d', domain: 'www.timeform.com' },
            { name: 'ASP.NET_SessionId', value: 'kimdzwjbfyliqp0xv0krflwy', domain: 'www.timeform.com' },
            { name: 'OptanonAlertBoxClosed', value: '2024-03-20T12:20:34.754Z', domain: '.timeform.com' },
            { name: 'OptanonConsent', value: 'isGpcEnabled=0&datestamp=Wed+Mar+20+2024+13%3A27%3A44+GMT%2B0000+(Greenwich+Mean+Time)&version=6.39.0&isIABGlobal=false&hosts=&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0004%3A1&AwaitingReconsent=false&geolocation=%3B', domain: '.timeform.com' },
            { name: 'TFM', value: 'DeviceId=46452746-a5c6-4d7e-bb3d-ebde0d4029a6', domain: 'www.timeform.com' },
            { name: '__RequestVerificationToken_L2hvcnNlLXJhY2luZw2', value: '6ef-Cs-AwrtiSMNsRVlNFamI94CAmlmlVFdQQu5OjKVYZzjdIBoZ0SykBuJRK3qLk7kqcd5ojYS0qdnZ9Ay9EEM9tlQ1', domain: 'www.timeform.com' }
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