import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';

const SCREENSHOTS_DIR = path.resolve('screenshots');
const ARTIFACTS_DIR = path.resolve('C:/Users/Edy/.gemini/antigravity/brain/c3aea67c-8c5a-4a88-8408-2e6ff0f4e36a/screenshots');
const BASE_URL = 'http://localhost:4173';

async function run() {
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });

  console.log('[SCREENSHOTS] Launching headless browser for mobile stories test...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  async function snap(name) {
    const localPath = path.join(SCREENSHOTS_DIR, name);
    const artifactPath = path.join(ARTIFACTS_DIR, name);
    await page.screenshot({ path: localPath, fullPage: false });
    await fs.copyFile(localPath, artifactPath);
    console.log(`[SCREENSHOTS] Saved ${name}`);
  }

  // 1. Home Screen with Mini-Map
  await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await snap('01-start-minimap.png');

  // 2. Tap on Marker to open Bottom Sheet Drawer (e.g. Cheile Sohodolului)
  await page.evaluate(() => {
    const marker = document.querySelector('.map-point-marker[data-id="a-chei-rau"]');
    if (marker) marker.dispatchEvent(new Event('click', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 500));
  await snap('02-minimap-bottom-sheet.png');

  // 3. Filter by Category B (Tradiții)
  await page.evaluate(() => {
    const chipB = document.querySelector('.map-chip[data-cat="B"]');
    if (chipB) chipB.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await snap('03-minimap-filter-cat.png');

  // 4. Open Story: Maria Apostol (Category C)
  await page.goto(`${BASE_URL}/#/poveste/c-personalitate-locala`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await snap('04-story-slide-1.png');

  // 5. Open Story: Portul Popular (Category B) with "Știai că?"
  await page.goto(`${BASE_URL}/#/poveste/b-port-popular-ansamblu`, { waitUntil: 'networkidle0' });
  // Advance to slide 3 to see "Știai că?"
  await page.evaluate(() => {
    const nextZone = document.getElementById('zone-next');
    if (nextZone) {
      nextZone.click();
      setTimeout(() => nextZone.click(), 200);
    }
  });
  await new Promise(r => setTimeout(r, 600));
  await snap('05-story-did-you-know.png');

  // 6. Open Gallery Lightbox
  await page.evaluate(() => {
    const btn = document.getElementById('btn-open-gallery');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await snap('06-story-gallery-lightbox.png');

  // Close gallery
  await page.evaluate(() => {
    const closeBtn = document.getElementById('btn-close-gallery');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // 7. Advance to Final Slide of Story (Quiz) & Answer correctly!
  await page.evaluate(() => {
    const nextZone = document.getElementById('zone-next');
    if (nextZone) {
      nextZone.click();
      setTimeout(() => nextZone.click(), 150);
      setTimeout(() => nextZone.click(), 300);
    }
  });
  await new Promise(r => setTimeout(r, 600));

  // Click correct quiz option (first option, index 0)
  await page.evaluate(() => {
    const opt0 = document.querySelector('.btn-quiz-option[data-index="0"]');
    if (opt0) opt0.click();
  });
  await new Promise(r => setTimeout(r, 1500)); // wait for stamp animation & unlock
  await snap('07-story-quiz-unlocked.png');

  // 8. Passport View with 12 Slots
  await page.goto(`${BASE_URL}/#/pasaport`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await snap('08-pasaport-12-slots.png');

  await browser.close();
  console.log('[SCREENSHOTS] All mobile stories screenshots captured successfully!');
}

run().catch(err => {
  console.error('[SCREENSHOTS] Fatal error:', err);
  process.exit(1);
});
