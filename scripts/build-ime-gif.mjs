// IME 入力の GIF を、デモサイトを実際に操作して記録する。
// 変換は Chrome DevTools Protocol の Input.imeSetComposition で発生させるので、
// グリッドは本物の compositionstart / compositionend を受け取っている。
//   出力: public/ime.gif（README と npm ページ用）
// 要 ffmpeg。`npm run build:gif`
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { mkdtempSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '..', 'public', 'ime.gif');
const url =
  process.argv[2] ?? 'https://t92345era.github.io/react-masume-grid/#/ja/guide/ime';

const CHROME =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const FPS = 10;
const frames = mkdtempSync(join(tmpdir(), 'ime-gif-'));
let n = 0;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 800, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle0' });
await page.waitForSelector('.masume-grid [data-row]');

const grid = await page.$('.masume-grid');

/** 現在の画面を hold フレーム分だけ書き出す（10fps なので hold=10 で1秒） */
async function shoot(hold = 1) {
  const first = join(frames, `f${String(n).padStart(4, '0')}.png`);
  await grid.screenshot({ path: first });
  n += 1;
  for (let i = 1; i < hold; i += 1) {
    copyFileSync(first, join(frames, `f${String(n).padStart(4, '0')}.png`));
    n += 1;
  }
}

const client = await page.createCDPSession();
const compose = async (text) => {
  await client.send('Input.imeSetComposition', {
    text,
    selectionStart: text.length,
    selectionEnd: text.length,
  });
};

// 空行のセルを選ぶ（選択されているだけで、まだ編集状態ではない）
await (await page.$('[data-row="2"][data-col="0"]')).click();
await shoot(12);

// IME オンで打ち始める: compositionstart でセルが編集状態になる
for (const text of ['あ', 'あお', 'あおき']) {
  await compose(text);
  await shoot(4);
}

// 変換（候補を選んだ状態）
await compose('青木');
await shoot(10);

// 確定
await client.send('Input.insertText', { text: '青木' });
await shoot(12);

// 確定後に間を置いてからの Enter は、通常どおり下のセルへ移動する。
// 変換確定の直後（80ms 以内）に来た Enter はグリッドが握り潰すため、
// ここで待たないと「確定の Enter」と見分けがつかない
await new Promise((r) => setTimeout(r, 400));
await page.keyboard.press('Enter');
await shoot(16);

await browser.close();

execFileSync(
  'ffmpeg',
  [
    '-y', '-framerate', String(FPS),
    '-i', join(frames, 'f%04d.png'),
    '-vf', `fps=${FPS},scale=760:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=bayer:bayer_scale=3`,
    '-loop', '0',
    out,
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] },
);
rmSync(frames, { recursive: true, force: true });

console.log(`wrote ${out} (${n} frames)`);
