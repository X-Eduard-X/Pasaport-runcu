import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const OUT_DIR = 'C:/Users/Edy/.gemini/antigravity/brain/c3aea67c-8c5a-4a88-8408-2e6ff0f4e36a/screenshots_festival';
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
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Home View: Scroll to Festival Section
  console.log('1. Checking Festival Section at bottom of Home View...');
  await page.goto('http://localhost:4173/#/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    sessionStorage.setItem('runcu_intro_completed_session', 'true');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const sec = document.querySelector('#festivalul-ion-canavoiu');
    if (sec) sec.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT_DIR, '1-festival-section-header.png') });

  // Scroll to gallery of 3 photos
  await page.evaluate(() => {
    const grid = document.querySelector('.festival-gallery-block');
    if (grid) grid.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT_DIR, '2-festival-3-photos-grid.png') });

  // 2. Map with Festival Beacon
  console.log('2. Checking Festival Beacon on MiniMap...');
  await page.evaluate(() => {
    const map = document.querySelector('#osm-map-container');
    if (map) map.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUT_DIR, '3-map-with-festival-marker.png') });

  // Click festival marker to open bottom sheet
  const festivalMarker = await page.$('.osm-festival-marker-wrap');
  if (festivalMarker) {
    await festivalMarker.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, '4-map-festival-bottom-sheet.png') });
  }

  // 3. Story View Slides (1, 2, 3 in exact order)
  console.log('3. Checking Story View slides...');
  await page.goto('http://localhost:4173/#/poveste/c-personalitate-locala', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUT_DIR, '5-story-slide1-afis.png') });

  const nextZone = await page.$('#zone-next');
  if (nextZone) {
    await nextZone.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, '6-story-slide2-portret.png') });

    await nextZone.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, '7-story-slide3-atelier-runcu.png') });
  }

  // 4. Mobile Viewport (390px)
  console.log('4. Checking Mobile Viewport...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:4173/#/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    sessionStorage.setItem('runcu_intro_completed_session', 'true');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const sec = document.querySelector('#festivalul-ion-canavoiu');
    if (sec) sec.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT_DIR, '8-mobile-festival-section.png') });

  console.log('All festival verification screenshots captured!');
  await browser.close();
}

main().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
