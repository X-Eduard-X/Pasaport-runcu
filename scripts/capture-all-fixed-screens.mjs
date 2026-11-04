import puppeteer from 'puppeteer';
import path from 'path';

const OUT_DIR = 'C:/Users/Edy/.gemini/antigravity/brain/c3aea67c-8c5a-4a88-8408-2e6ff0f4e36a/screenshots_fixes';
const CHROME_PATH = 'C:/Users/Edy/.cache/puppeteer/chrome/win64-156.0.8078.47/chrome-win64/chrome.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Desktop 1920x920 (matching user's browser with taskbar)
  await page.setViewport({ width: 1920, height: 920 });
  await page.goto('http://localhost:5173/#/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle0' });

  // Capture boundary + title + stamp in Step 2/3
  await new Promise(r => setTimeout(r, 2200));
  await page.screenshot({ path: path.join(OUT_DIR, 'fixed-intro-step2-3-desktop.png') });

  // Capture 3D booklet + CTA button in Step 4/5
  await new Promise(r => setTimeout(r, 1600));
  await page.screenshot({ path: path.join(OUT_DIR, 'fixed-intro-step4-5-desktop.png') });

  // 2. Unlock view on 1920x1080 (User's Image 3)
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5173/#/stampila/a-poteca-padure/4f209e79d541d2291860187074dc3aea', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUT_DIR, 'fixed-unlock-desktop-1080p.png') });

  // 3. Unlock view on laptop 1366x768
  await page.setViewport({ width: 1366, height: 768 });
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: path.join(OUT_DIR, 'fixed-unlock-laptop-768p.png') });

  // 4. Mobile 390x844 (iPhone 14)
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/#/stampila/a-poteca-padure/4f209e79d541d2291860187074dc3aea', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUT_DIR, 'fixed-unlock-mobile-390p.png') });

  await browser.close();
  console.log('Successfully captured all fixed screenshots!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
