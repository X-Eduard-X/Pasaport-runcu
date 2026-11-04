import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';

const SCREENSHOTS_DIR = path.resolve('screenshots/before');
const ARTIFACTS_DIR = path.resolve('C:/Users/Edy/.gemini/antigravity/brain/c3aea67c-8c5a-4a88-8408-2e6ff0f4e36a/screenshots_before');
const BASE_URL = 'http://localhost:4173';

async function run() {
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });

  console.log('[BASELINE] Launching headless browser for baseline screenshots...');
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
    console.log(`[BASELINE] Saved ${name}`);
  }

  // 1. Start / Mini-Hartă
  await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await snap('start-minimap.png');

  // 2. Poveste
  await page.goto(`${BASE_URL}/#/poveste/a-chei-rau`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await snap('poveste.png');

  // 3. Pașaport Gol
  await page.goto(`${BASE_URL}/#/pasaport`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await snap('pasaport-gol.png');

  // 4. Pașaport Parțial (deblocare 2 ștampile)
  await page.goto(`${BASE_URL}/#/stampila/a-chei-rau/fc878be99183f63bf2dcadbe5509c298`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.goto(`${BASE_URL}/#/stampila/b-port-popular-ansamblu/eb2120433fa7f5fe906c388fef6ab1bd`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.goto(`${BASE_URL}/#/pasaport`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await snap('pasaport-partial.png');

  // 5. Pașaport Complet (deblocare restul)
  await page.evaluate(() => {
    // Unlock remaining for passport completion screenshot
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
        timeFormatted: '09:30',
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

  // 6. Certificat
  await page.goto(`${BASE_URL}/#/certificat`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 700));
  await snap('certificat.png');

  await browser.close();
  console.log('[BASELINE] All baseline screenshots successfully captured!');
}

run().catch(err => {
  console.error('[BASELINE] Error:', err);
  process.exit(1);
});
