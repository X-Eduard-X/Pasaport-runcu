import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const OUT_DIR = 'C:/Users/Edy/.gemini/antigravity/brain/c3aea67c-8c5a-4a88-8408-2e6ff0f4e36a/screenshots_fixes';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:/Users/Edy/.cache/puppeteer/chrome/win64-156.0.8078.47/chrome-win64/chrome.exe';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  // Standard 1080p desktop with simulated browser chrome inner height (1920 x 920)
  await page.setViewport({ width: 1920, height: 920 });

  console.log('Testing Intro on http://localhost:5173...');
  // Clear sessionStorage to trigger full intro
  await page.goto('http://localhost:5173/#/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle0' });

  // 1. Wait for boundary and title to reveal (around t = 1.4s)
  await new Promise(r => setTimeout(r, 1400));
  const boundaryBox = await page.$eval('#intro-boundary-box', el => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, height: rect.height };
  }).catch(() => null);

  console.log('Intro Boundary Box rect:', boundaryBox);
  await page.screenshot({ path: path.join(OUT_DIR, 'fix1-intro-step2-desktop.png') });

  // 2. Wait for Phase 2: 3D booklet and CTA button (around t = 3.6s)
  await new Promise(r => setTimeout(r, 2400));
  const ctaBtnBox = await page.$eval('#btn-intro-open-journal', el => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, height: rect.height, inView: rect.bottom <= 920 };
  }).catch(() => null);

  console.log('Intro CTA button rect:', ctaBtnBox);
  await page.screenshot({ path: path.join(OUT_DIR, 'fix2-intro-step4-cta-desktop.png') });

  // 3. Test Unlock View on the exact stamp from user image: a-poteca-padure
  console.log('Testing Unlock View on http://localhost:5173/#/stampila/a-poteca-padure/4f209e79d541d2291860187074dc3aea...');
  await page.goto('http://localhost:5173/#/stampila/a-poteca-padure/4f209e79d541d2291860187074dc3aea', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  const unlockCardBox = await page.$eval('.unlock-view', el => {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      viewportWidth: window.innerWidth,
      isCentered: Math.abs((window.innerWidth - rect.width) / 2 - rect.left) < 10
    };
  }).catch(() => null);

  console.log('Unlock Card rect:', unlockCardBox);
  await page.screenshot({ path: path.join(OUT_DIR, 'fix3-unlock-view-desktop.png') });

  // 4. Test on smaller laptop screen (1366 x 680 net inner height)
  console.log('Testing on smaller laptop resolution (1366x680)...');
  await page.setViewport({ width: 1366, height: 680 });
  await page.screenshot({ path: path.join(OUT_DIR, 'fix3-unlock-view-laptop.png') });

  // And test Intro on laptop resolution
  await page.evaluate(() => {
    sessionStorage.clear();
  });
  await page.goto('http://localhost:5173/#/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3700));

  const laptopCtaBox = await page.$eval('#btn-intro-open-journal', el => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, height: rect.height, inView: rect.bottom <= 680 };
  }).catch(() => null);

  console.log('Laptop CTA button rect:', laptopCtaBox);
  await page.screenshot({ path: path.join(OUT_DIR, 'fix2-intro-step4-cta-laptop.png') });

  await browser.close();
  console.log('All tests finished successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
