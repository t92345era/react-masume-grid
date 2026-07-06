import puppeteer from 'puppeteer-core';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 800 });
await page.goto('http://localhost:5199', { waitUntil: 'networkidle0' });
await page.waitForSelector('.masume-grid [data-row]');

const dblclick = async (el) => {
  const b = await el.boundingBox();
  const x = b.x + b.width / 2;
  const y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.up();
  await page.mouse.down({ clickCount: 2 });
  await page.mouse.up({ clickCount: 2 });
};

// 入荷日 (date) cell, row 0
await dblclick(await page.$('[data-row="0"][data-col="6"]'));
await sleep(300);
const input = await page.$('input[type="date"]');
console.log('1. editor opened by double-click:', !!input);

// click the calendar icon area (right edge of the input)
const box = await input.boundingBox();
await page.mouse.click(box.x + box.width - 12, box.y + box.height / 2);
await sleep(300);
const still = await page.$('input[type="date"]');
console.log('2. still editing after icon click:', !!still);

// set a date and commit
if (still) {
  await page.evaluate((el) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, '2026-12-24');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, still);
  await page.keyboard.press('Enter');
  await sleep(200);
  console.log(
    '3. committed cell text:',
    await page.evaluate(() => document.querySelector('[data-row="0"][data-col="6"]').textContent),
  );
}
await browser.close();
