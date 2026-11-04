import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const OUT_DIR = 'C:/Users/Edy/.gemini/antigravity/brain/c3aea67c-8c5a-4a88-8408-2e6ff0f4e36a/screenshots_logos';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:/Users/Edy/.cache/puppeteer/chrome/win64-156.0.8078.47/chrome-win64/chrome.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // 1. Home View with Institutional Strip & Header Stema
  console.log('Testing Home View logos...');
  await page.goto('http://localhost:5173/#/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    sessionStorage.setItem('runcu_intro_completed_session', 'true');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: path.join(OUT_DIR, 'logos-1-home-hero-desktop.png') });

  // Scroll to footer
  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT_DIR, 'logos-2-home-footer-desktop.png') });

  // 2. Passport View: Cover & Page 0
  console.log('Testing Passport View logos...');
  await page.goto('http://localhost:5173/#/pasaport', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Switch to cover
  const toggleCoverBtn = await page.$('#btn-toggle-cover');
  if (toggleCoverBtn) {
    await toggleCoverBtn.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUT_DIR, 'logos-3-passport-cover-desktop.png') });
    // Switch back to pages
    await toggleCoverBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }
  await page.screenshot({ path: path.join(OUT_DIR, 'logos-4-passport-page0-desktop.png') });

  // 3. Certificate View with Canvas Drawn Logos
  console.log('Testing Certificate View logos...');
  await page.goto('http://localhost:5173/#/certificat', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUT_DIR, 'logos-5-certificate-desktop.png') });

  // 4. Mobile Responsiveness (390x844)
  console.log('Testing Mobile responsiveness with logos...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/#/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUT_DIR, 'logos-6-home-mobile-390p.png') });

  await browser.close();
  console.log('All logo verification screenshots captured successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
