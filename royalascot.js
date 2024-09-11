const Puppeteer = require('puppeteer');
const fs = require('fs');

const TRAINERS_SELECTOR = 'a[href^="/royal-ascot/stable-tours/"].a--plain';
const HORSES_SELECTOR = 'article > div[id^="expandable"] > .panel-content > .push--small:not(.table-wrapper)';

const date = new Date();
const pad = number => number < 10 ? '0' + number : number;
const stringDate = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear() % 2000}`;

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getUserInput() {
  return new Promise((resolve) => {
    readline.question('Enter a custom URL (Press Enter to use default): ', (url) => {
      resolve(url.trim());
      readline.close();
    });
  });
}

async function init(customUrl) {
  try {
    // Create the output directory if it doesn't exist
    if (!fs.existsSync('./output')) {
      fs.mkdirSync('./output');
    }

    console.log('[+] Launching browser');
    const browser = await Puppeteer.launch();
    console.log('[+] Opened a new browser instance');

    console.log('[+] Opening a new page');
    const page = await browser.newPage();
    console.log('[+] Opened a new page');

    page.setExtraHTTPHeaders({ 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36' });
    console.log('[+] Set user agent for the page');

    console.log('[+] Going to ATR Stable Tours');
    await page.goto(customUrl || 'https://www.attheraces.com/stable-tours');
    console.log('[+] Navigated to the ATR Stable Tours page');

    console.log('[+] Getting trainers information');
    await page.waitForSelector(TRAINERS_SELECTOR);
    console.log('[+] Found the trainers selector');

    const trainers = await page.$$eval(TRAINERS_SELECTOR, elements => elements.map(a => ({
      url: a.href,
      name: a.innerText,
      filename: a.innerText.replace(/[/\\?%*:|"<>]/g, '_') + '.txt'
    })));
    console.log('[+] Extracted the trainers information');

    for (const trainer of trainers) {
      console.log(`[+] Going to ${trainer.name} trainer's page`);
      await page.goto(trainer.url, { waitUntil: 'networkidle0' });
      console.log(`[+] Navigated to ${trainer.name} trainer's page`);

      console.log('[+] Getting horses information');
      try {
        await page.waitForSelector(HORSES_SELECTOR, { timeout: 5000 });
        console.log('[+] Found the horses selector');

        const horseData = await page.$$eval(HORSES_SELECTOR, elements => elements.map((element, index) => {
          const header = element.parentElement.parentElement.parentElement.children[0].children[0].children[0];
          const content = element.children[1];
          const horseName = header ? header.innerText.trim() : '';
          const formProfile = index % 2 === 0 ? 'Form Profile\n' : '';
          const trainerSays = content ? content.innerText.trim() : '';
          return index % 2 === 0 ? `${horseName}\n${formProfile}${trainerSays}\nTrainer says` : `${trainerSays}`;
        }));
        console.log('[+] Extracted the horses information');

        const content = horseData.map((data, index) => `${index % 2 === 0 ? `ATR Stable Tour ${stringDate}\n${data}` : `\n${data}`}`).join('\n');
        console.log('[+] Formatted the horses data');

        console.log(`[+] Writing data to ${trainer.filename}`);
        fs.writeFileSync(`./output/${trainer.filename}`, content);
        console.log(`[+] Wrote data to ${trainer.filename}`);

        await new Promise(resolve => setTimeout(resolve, 1000)); // Add a 1-second delay between requests
        console.log('[+] Added a 1-second delay before the next request');
      } catch (e) {
        console.log(`[+] Error getting horses information for trainer ${trainer.name}:`, e);
      }
    }

    await browser.close();
    console.log('[+] Closed the browser');
  } catch (error) {
    console.error('An error occurred during the scraping process:', error);
  }
}

async function retryInit(customUrl, maxRetries = 3, retryDelay = 5000) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      await init(customUrl);
      break;
    } catch (error) {
      retries++;
      console.log(`[+] Retry attempt ${retries}/${maxRetries} failed. Retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

(async () => {
  const customUrl = await getUserInput();
  await retryInit(customUrl);
})();