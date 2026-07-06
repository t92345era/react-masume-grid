import puppeteer from 'puppeteer-core';

const SCRATCH = '/private/tmp/claude-501/-Users-tera-Source-react-masume-grid/76a516fa-ae73-43a9-ab1a-6f7b996f4ca1/scratchpad';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
});
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 800 });
await page.goto('http://localhost:5199', { waitUntil: 'networkidle0' });
await page.waitForSelector('.masume-grid [data-row]');

const state = async (label) => {
  const s = await page.evaluate(() => {
    const el = document.querySelector('.masume-grid');
    const q = (sel) => {
      const n = document.querySelector(sel);
      if (!n) return null;
      const r = n.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top) };
    };
    return {
      scrollLeft: Math.round(el.scrollLeft),
      scrollTop: Math.round(el.scrollTop),
      corner: q('[data-corner]'),
      hcol0: q('[data-hcol="0"]'),
      firstRownum: q('[data-rownum]'),
      firstCol0Cell: q('[data-col="0"]'),
      gridLeft: Math.round(el.getBoundingClientRect().left),
    };
  });
  console.log(label, JSON.stringify(s));
  return s;
};

const shot = async (name) => {
  const grid = await page.$('.masume-grid');
  await grid.screenshot({ path: `${SCRATCH}/${name}.png` });
};

// --- Scenario A: Cmd+End then Cmd+Home ---
await page.click('[data-row="0"][data-col="0"]');
await state('A0 initial:');
await page.keyboard.down('Meta');
await page.keyboard.press('End');
await page.keyboard.up('Meta');
await sleep(300);
await state('A1 after Cmd+End:');
await shot('bug3-A1-after-end');
await page.keyboard.down('Meta');
await page.keyboard.press('Home');
await page.keyboard.up('Meta');
await sleep(300);
await state('A2 after Cmd+Home:');
await shot('bug3-A2-after-home');

// --- Scenario B: scroll right by wheel, then toggle row numbers off/on ---
const gridBox = await (await page.$('.masume-grid')).boundingBox();
await page.mouse.move(gridBox.x + 400, gridBox.y + 200);
await page.mouse.wheel({ deltaX: 120 });
await sleep(200);
await state('B0 wheeled right:');
const labels = await page.$$('.demo-toolbar label');
await labels[0].click(); // 行番号を表示 off
await sleep(200);
await labels[0].click(); // on
await sleep(300);
await state('B1 after rownum toggle off/on:');
await shot('bug3-B1-after-toggle');

// --- Scenario C: toggle header while scrolled ---
await labels[1].click(); // ヘッダー off
await sleep(200);
await labels[1].click(); // on
await sleep(300);
await state('C1 after header toggle off/on:');
await shot('bug3-C1-after-header-toggle');

// --- Scenario D: programmatic scroll to far right then arrow-left back home ---
await page.click('[data-row="2"][data-col="1"]');
await page.keyboard.down('Meta');
await page.keyboard.press('End');
await page.keyboard.up('Meta');
await sleep(200);
// walk left with plain Home key (row start)
await page.keyboard.press('Home');
await sleep(300);
await state('D1 after End then Home(row):');
await shot('bug3-D1-after-row-home');

// --- Scenario E: Cmd+End (active = last cell), then toggle row numbers ---
await page.keyboard.down('Meta');
await page.keyboard.press('Home');
await page.keyboard.up('Meta');
await sleep(200);
await page.click('[data-row="2"][data-col="1"]');
await page.keyboard.down('Meta');
await page.keyboard.press('End');
await page.keyboard.up('Meta');
await sleep(200);
const e0 = await state('E0 after Cmd+End:');
await labels[0].click(); // 行番号 off
await sleep(200);
await labels[0].click(); // on
await sleep(300);
const e1 = await state('E1 after rownum toggle off/on:');
console.log(
  e0.scrollLeft === e1.scrollLeft
    ? 'E OK: scrollLeft preserved (last cell kept in view)'
    : `E DRIFT: ${e0.scrollLeft} -> ${e1.scrollLeft}`,
);
await shot('bug3-E1-after-end-toggle');

await browser.close();
console.log('done');
