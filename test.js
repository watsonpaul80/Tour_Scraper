const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    console.log('Testing page.waitForTimeout()...');
    await page.waitForTimeout(1000);
    console.log('Function is working correctly.');
    await browser.close();
})();
