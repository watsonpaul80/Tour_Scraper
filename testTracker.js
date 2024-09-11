<<<<<<< HEAD
const puppeteer = require('puppeteer');

async function testAddNotesToTracker(horseName, trainerName, horseNotes) {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Set cookies here (use the same cookies from the tracker.js script)
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
            await browser.close();
            return;
        }

        console.log('Search Results:');
        searchResults.forEach((result, index) => {
            console.log(`${index + 1}. ${result.text}`);
        });

        const selectedHorseLink = 'https://www.timeform.com' + searchResults[0].href;
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
            finalNotes = `${currentDate}\n\n${horseNotes}\n\n${existingNotes}`;
        }

        // Click on the buttons
        const buttonSelectors = [
            '[data-btn="dec"]',
            '[data-btn="eve"]',
            '[data-btn="morn"]',
            '[data-btn="res"]'
        ];

        for (const selector of buttonSelectors) {
            await page.waitForSelector(selector, { timeout: 5000 });
            await page.click(selector);
            console.log(`Clicked button: ${selector}`);
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
        } else {
            console.log(`Failed to save notes for horse: ${horseName}`);
        }

        await browser.close();
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

// Usage example
const testHorseName = 'Frankel';
const testTrainerName = 'David Pipe';
const testHorseNotes = `Form Profile
Winner of two of his five starts over hurdles and currently rated 110. Made a winning debut over hurdles at Newton Abbot (2m2½f) in August, and followed up with a two-and-a-half-length victory over Chankaya in a novice event (2m5½f) at the same course in September. Probably best effort since when fourth, beaten three and three quarter lengths, to Springwell Bay in a handicap hurdle at Cheltenham (2m5f) in November off a mark of 108.

Trainer says
Wonderful Eagle is more of a spring horse, so he hasn't run for a bit. He won twice in the autumn but is back on course and will be out again before too long.`;

=======
const puppeteer = require('puppeteer');

async function testAddNotesToTracker(horseName, trainerName, horseNotes) {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Set cookies here (use the same cookies from the tracker.js script)
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
            await browser.close();
            return;
        }

        console.log('Search Results:');
        searchResults.forEach((result, index) => {
            console.log(`${index + 1}. ${result.text}`);
        });

        const selectedHorseLink = 'https://www.timeform.com' + searchResults[0].href;
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
            finalNotes = `${currentDate}\n\n${horseNotes}\n\n${existingNotes}`;
        }

        // Click on the buttons
        const buttonSelectors = [
            '[data-btn="dec"]',
            '[data-btn="eve"]',
            '[data-btn="morn"]',
            '[data-btn="res"]'
        ];

        for (const selector of buttonSelectors) {
            await page.waitForSelector(selector, { timeout: 5000 });
            await page.click(selector);
            console.log(`Clicked button: ${selector}`);
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
        } else {
            console.log(`Failed to save notes for horse: ${horseName}`);
        }

        await browser.close();
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

// Usage example
const testHorseName = 'Frankel';
const testTrainerName = 'David Pipe';
const testHorseNotes = `Form Profile
Winner of two of his five starts over hurdles and currently rated 110. Made a winning debut over hurdles at Newton Abbot (2m2½f) in August, and followed up with a two-and-a-half-length victory over Chankaya in a novice event (2m5½f) at the same course in September. Probably best effort since when fourth, beaten three and three quarter lengths, to Springwell Bay in a handicap hurdle at Cheltenham (2m5f) in November off a mark of 108.

Trainer says
Wonderful Eagle is more of a spring horse, so he hasn't run for a bit. He won twice in the autumn but is back on course and will be out again before too long.`;

>>>>>>> 72a64cd (Initial commit)
testAddNotesToTracker(testHorseName, testTrainerName, testHorseNotes);