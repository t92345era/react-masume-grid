// OGP 画像（1280×640）を scripts/ogp.html から書き出す。
// デザインを変えるときは HTML を編集して `npm run build:ogp` を実行する。
//   - public/ogp.png … デモサイト（GitHub Pages）が配信する og:image
//   - GitHub の Social preview は API がないため、生成後に手動アップロードする
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, 'ogp.html');
// デモサイト用は 2倍解像度、GitHub の Social preview 用は 1280×640 ちょうど
const out = resolve(here, '..', 'public', 'ogp.png');
const outGithub = resolve(here, '..', 'public', 'ogp-github.png');

const CHROME =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();

for (const [path, deviceScaleFactor] of [
  [out, 2],
  [outGithub, 1],
]) {
  await page.setViewport({ width: 1280, height: 640, deviceScaleFactor });
  await page.goto(`file://${source}`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path });
  console.log(`wrote ${path}`);
}

await browser.close();
