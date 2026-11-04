import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  
  const results = {};
  
  // 1. Test Home & Map
  console.log('[TEST] Checking Home & Map...');
  await page.goto('http://localhost:4173/#/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const btn = document.getElementById('btn-start-expedition');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  results.filterChips = await page.evaluate(() => {
    const chipA = document.querySelector('.map-chip[data-cat="A"]');
    if (chipA) chipA.click();
    const markersA = document.querySelectorAll('.osm-marker-wrap').length;
    
    const chipAll = document.querySelector('.map-chip[data-cat="ALL"]');
    if (chipAll) chipAll.click();
    const markersAll = document.querySelectorAll('.osm-marker-wrap').length;
    return { markersA, markersAll };
  });

  results.markerClick = await page.evaluate(async () => {
    const marker = document.querySelector('.osm-marker-wrap');
    if (marker) marker.click();
    await new Promise(r => setTimeout(r, 400));
    const sheet = document.getElementById('map-bottom-sheet');
    const title = document.querySelector('.sheet-place-title')?.textContent;
    const isOpen = sheet?.classList.contains('is-open');
    return { isOpen, title };
  });

  // 2. Test Story Navigation & Quiz
  console.log('[TEST] Checking Story & Quiz...');
  await page.evaluate(() => { window.location.hash = '#/poveste/b-port-popular-ansamblu'; });
  await new Promise(r => setTimeout(r, 600));
  results.story = await page.evaluate(async () => {
    const stage = !!document.getElementById('story-stage');
    const bars = document.querySelectorAll('.story-bar-track').length;
    return { stage, bars };
  });

  // 3. Test Passport View
  console.log('[TEST] Checking Passport View...');
  await page.evaluate(() => { window.location.hash = '#/pasaport'; });
  await new Promise(r => setTimeout(r, 600));
  results.passport = await page.evaluate(() => {
    const booklet = !!document.getElementById('booklet-3d');
    const cover = !!document.getElementById('journal-cover');
    const spreads = document.querySelectorAll('.journal-page-spread').length;
    return { booklet, cover, spreads };
  });

  // 4. Test Unlock Route
  console.log('[TEST] Checking Unlock Route...');
  await page.evaluate(() => { window.location.hash = '#/stampila/a-chei-rau/fc878be99183f63bf2dcadbe5509c298'; });
  await new Promise(r => setTimeout(r, 600));
  results.unlock = await page.evaluate(() => {
    const title = document.querySelector('.unlock-place-title')?.textContent;
    const hasStamp = !!document.getElementById('unlock-stamp-wrap');
    return { title, hasStamp };
  });

  // 5. Test Certificate View
  console.log('[TEST] Checking Certificate View...');
  await page.evaluate(() => { window.location.hash = '#/certificat'; });
  await new Promise(r => setTimeout(r, 600));
  results.certificate = await page.evaluate(() => {
    const canvas = !!document.getElementById('cert-canvas');
    const nameInput = !!document.getElementById('cert-name-input');
    return { canvas, nameInput };
  });

  console.log('--- ALL TEST RESULTS ---');
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch(err => {
  console.error('[TEST ERROR]', err);
  process.exit(1);
});
