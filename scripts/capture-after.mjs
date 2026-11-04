import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';

const SCREENSHOTS_DIR = path.resolve('screenshots/after');
const ARTIFACTS_DIR = path.resolve('C:/Users/Edy/.gemini/antigravity/brain/c3aea67c-8c5a-4a88-8408-2e6ff0f4e36a/screenshots_after');
const BASE_URL = 'http://localhost:4173';

async function run() {
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });

  console.log('[AFTER] Launching headless browser for AFTER screenshots...');
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
    console.log(`[AFTER] Saved ${name}`);
  }

  // 0. Cinematic Intro & Expedition Prologue
  await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 700));
  await snap('intro-cinematic.png');

  // Dismiss intro by clicking "Deschide Jurnalul"
  await page.evaluate(() => {
    const btn = document.getElementById('btn-start-expedition');
    if (btn) btn.click();
  });
  // Wait for Leaflet map tiles and geojson boundary to load
  await new Promise(r => setTimeout(r, 2200));
  await snap('start-minimap.png');

  // 2. Poveste Full-Screen (Ken Burns + narrative card)
  await page.goto(`${BASE_URL}/#/poveste/a-chei-rau`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await snap('poveste.png');

  // 3. Pașaport Leather Cover View
  await page.goto(`${BASE_URL}/#/pasaport`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    // Click button to show the 3D leather cover
    const btn = document.getElementById('btn-toggle-cover');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await snap('pasaport-cover.png');

  // 4. Pașaport Warm Paper Spread with Guilloche & Category Ink Rings
  await page.evaluate(() => {
    // Toggle back to paper pages
    const btn = document.getElementById('btn-toggle-cover');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await snap('pasaport-pagini.png');

  // 5. Pașaport Category A Stamps Page
  await page.evaluate(() => {
    const nextBtn = document.getElementById('btn-next-page');
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await snap('pasaport-cat-a.png');

  // 6. Pașaport Complet (All 12 stamps on paper)
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('pasaport_runcu_v1') || '{}');
    data.unlocked = data.unlocked || {};
    const ids = [
      'a-chei-rau', 'a-varful-arcanu', 'a-drum-priveliste', 'a-poteca-padure', 'a-interior-candelabru',
      'b-port-popular-ansamblu', 'b-dans-hora', 'b-mesteguri-torsul-lanii', 'b-gastronomie-locala',
      'c-personalitate-locala', 'd-rachiti-troite-lemn', 'd-poveste-comunitate'
    ];
    ids.forEach(id => {
      data.unlocked[id] = {
        unlockedAt: new Date().toISOString(),
        dateFormatted: '04.11.2026',
        timeFormatted: '09:45',
        verified: true,
        method: 'qr'
      };
    });
    data.userName = 'Mihai Exploratorul';
    localStorage.setItem('pasaport_runcu_v1', JSON.stringify(data));
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await snap('pasaport-complet.png');

  // 7. Certificat Oficial
  await page.goto(`${BASE_URL}/#/certificat`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 700));
  await snap('certificat.png');

  await browser.close();
  console.log('[AFTER] All AFTER screenshots successfully captured!');
}

run().catch(err => {
  console.error('[AFTER] Error:', err);
  process.exit(1);
});
