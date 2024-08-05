const puppeteer = require("puppeteer");

let browser;

async function initBrowser() {
  if (!browser) {
    browser = await puppeteer.launch();
  }
}

async function getInitialState(url) {
  await initBrowser();
  const page = await browser.newPage();
  await page.goto(url);
  const content = await page.content();
  await page.close();
  return content;
}

async function monitorUrl(url, interval, callback) {
  await initBrowser();
  const page = await browser.newPage();
  await page.goto(url);
  setInterval(async () => {
    await page.reload();
    const currentState = await page.content();
    callback(currentState);
  }, interval * 60 * 1000);
}

module.exports = { getInitialState, monitorUrl };
