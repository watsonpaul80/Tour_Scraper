const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
require('dotenv').config(); // Load environment variables

// Use stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

// Helper function for delays
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function login(page) {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    console.log('Logging in...');
    await page.goto('https://www.timeform.com/horse-racing/account/sign-in?returnUrl=%2Fhorse-racing%2F');

    // Wait for the email and password fields
    await page.waitForSelector('input[name="EmailAddress"]');
    await page.waitForSelector('input[name="Password"]');

    // Focus on and clear the email field before typing
    const emailField = await page.$('input[name="EmailAddress"]');
    await emailField.click({ clickCount: 3 }); // Triple-click to highlight any existing text
    await emailField.press('Backspace'); // Clear any pre-filled value

    // Type the email address with a delay for each character
    await page.type('input[name="EmailAddress"]', email, { delay: 100 });

    // Verify that the email has been entered correctly
    const enteredEmail = await page.$eval('input[name="EmailAddress"]', el => el.value);
    if (enteredEmail !== email) {
        throw new Error(`Email entered incorrectly: "${enteredEmail}" (expected "${email}")`);
    }

    console.log('Email entered successfully.');

    // Focus on and clear the password field before typing
    const passwordField = await page.$('input[name="Password"]');
    await passwordField.click({ clickCount: 3 });
    await passwordField.press('Backspace');
    await page.type('input[name="Password"]', password, { delay: 100 });

    console.log('Password entered successfully.');

    // Click the login button
    await page.click('input[type="submit"].button.submit-button');

    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('Login successful.');
}

async function ensureAllBellsOn(page) {
    console.log('Navigating to tracker page...');
    await page.goto('https://www.timeform.com/horse-racing/my-timeform/tracker', { waitUntil: 'networkidle2' });

    // Add a delay to ensure the page is fully rendered
    await delay(5000);

    // Dismiss any cookie banners or pop-ups
    const popup = await page.$('button[class*="cookie-consent"]');
    if (popup) {
        await popup.click();
        console.log('Dismissed cookie consent pop-up.');
    }

    let horsesProcessed = 0;

    while (true) {
        try {
            console.log('Waiting for tracker rows...');
            await page.waitForSelector('tbody.mytf-row.mytf-horse', { timeout: 60000 }); // Wait for the horse rows

            // Get all horse rows by selecting tbody elements
            const rows = await page.$$('tbody.mytf-row.mytf-horse');
            console.log(`Found ${rows.length} horse rows.`);

            for (const row of rows) {
                const bellSelectors = {
                    dec: 'div.tracker-dec-btn',
                    morn: 'div.tracker-morn-btn',
                    eve: 'div.tracker-eve-btn',
                    res: 'div.tracker-res-btn',
                };

                for (const [key, selector] of Object.entries(bellSelectors)) {
                    const bellIcon = await row.$(selector);

                    if (bellIcon) {
                        const isBellOff = await bellIcon.evaluate(el => el.classList.contains('tracker-icon-bell-off'));
                        if (isBellOff) {
                            console.log(`Enabling alert for ${key}...`);
                            await bellIcon.click();
                            await delay(300); // Small delay for UI updates
                        }
                    }
                }

                // Retrieve and log the horse name directly from the <tbody> attribute
                const horseName = await row.evaluate(el => el.getAttribute('data-mytfhorsename'));

                if (horseName) {
                    console.log(`Processed alerts for horse: ${horseName}`);
                } else {
                    console.warn('Warning: Could not retrieve horse name for a row.');
                }

                horsesProcessed++;
            }

            const nextButton = await page.$('.pagination-next a');
            if (nextButton) {
                console.log('Navigating to the next page...');
                await nextButton.click();
                await delay(3000); // Wait for the next page to load
            } else {
                console.log('No more pages to process. Finished.');
                break;
            }
        } catch (error) {
            console.error('Error processing page:', error.message);

            // Take a debug screenshot
            const timestamp = Date.now();
            await page.screenshot({ path: `tracker_page_error_${timestamp}.png`, fullPage: true });
            console.log(`Saved error screenshot: tracker_page_error_${timestamp}.png`);
            break; // Exit the loop on error
        }
    }

    console.log(`Processed ${horsesProcessed} horses in total.`);
}



(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await login(page);
        await ensureAllBellsOn(page);
    } catch (error) {
        console.error('A critical error occurred:', error.message);
    } finally {
        await browser.close();
    }
})();
