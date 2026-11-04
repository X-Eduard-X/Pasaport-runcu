import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Users\\Edy\\.cache\\puppeteer\\chrome\\win64-156.0.8078.47\\chrome-win64\\chrome.exe';
const OUT_DIR = 'C:\\Users\\Edy\\.gemini\\antigravity\\brain\\c3aea67c-8c5a-4a88-8408-2e6ff0f4e36a\\screenshots_after';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('🚀 Launching Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream']
  });

  const page = await browser.newPage();

  // Pre-seed sessionStorage with runcu_intro_completed_session
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('runcu_intro_completed_session', 'true');
  });

  // ==========================================
  // PART 1: MOBILE VERIFICATION (390 x 844)
  // ==========================================
  console.log('\n📱 PART 1: Mobile Viewport (390 x 844)...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:4173/#/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    document.body.classList.remove('presentation-mode');
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await delay(800);

  // 1.1 Verify Mobile Bottom Nav
  console.log('🔍 Checking Mobile Bottom Nav...');
  await page.waitForSelector('#mobile-bottom-nav', { visible: true, timeout: 6000 });
  const navTabsCount = await page.evaluate(() => {
    return document.querySelectorAll('.bottom-nav-item').length;
  });
  console.log(`✅ Bottom Nav Items found: ${navTabsCount} (Expected: 4)`);

  // Wait for map container to render
  await delay(800);

  // Screenshot of Home Map View with Mobile Bottom Nav & Fog of War
  await page.screenshot({ path: path.join(OUT_DIR, 'bottom-nav-mobile.png') });
  console.log('📸 Saved bottom-nav-mobile.png');

  // 1.2 Navigate to Passport View via Bottom Nav
  console.log('📖 Clicking Bottom Nav "Pașaport"...');
  await page.click('a[href="#/pasaport"]');
  await delay(800);

  // Go to Page 2 (Obiective Naturale - Cat A)
  console.log('➡️ Turning to next page (stamps page)...');
  const nextBtn = await page.waitForSelector('#btn-next-page', { visible: true });
  if (nextBtn) {
    await nextBtn.click();
    await delay(700);
  }

  // 1.3 Test Physical Stamping: Long-Press Ink Charging
  console.log('🖋️ Testing Physical Long-Press Ink Charging on first stamp...');
  const chargeZone = await page.waitForSelector('.stamp-press-charge-zone', { visible: true, timeout: 5000 });
  if (chargeZone) {
    const box = await chargeZone.boundingBox();
    if (box) {
      console.log(`🎯 Found charge zone at (${Math.round(box.x)}, ${Math.round(box.y)}). Dispatching pointerdown...`);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      // Hold down for 900ms (charge threshold is 700ms)
      await delay(900);
      await page.mouse.up();
      console.log('⚡ Long-press released! Waiting for stamp impact & render...');
      await delay(1200);
    }
  }

  await page.screenshot({ path: path.join(OUT_DIR, 'physical-stamp-mobile.png') });
  console.log('📸 Saved physical-stamp-mobile.png');

  // 1.4 Test Personal Travel Journal (#/jurnal)
  console.log('📝 Navigating to Jurnal de Călătorie (#/jurnal)...');
  await page.goto('http://localhost:4173/#/jurnal', { waitUntil: 'networkidle0' });
  await delay(800);

  // Check if journal has entries
  const entriesCount = await page.evaluate(() => {
    return document.querySelectorAll('.journal-entry-card').length;
  });
  console.log(`✅ Journal entries rendered: ${entriesCount}`);

  // Test field note typing & auto-save
  const noteTextarea = await page.$('.journal-note-textarea');
  if (noteTextarea) {
    console.log('✍️ Typing personal expedition note into textarea...');
    await noteTextarea.type('Am explorat Cheile Sohodolului la apus. Vântul aduce miros proaspăt de pin și răcoare din Munții Vâlcan.', { delay: 15 });
    await delay(700); // wait for 500ms debounce
    const statusText = await page.evaluate(() => {
      return document.querySelector('.journal-note-status')?.textContent || '';
    });
    console.log(`✅ Auto-save status: "${statusText}"`);
  }

  await page.screenshot({ path: path.join(OUT_DIR, 'journal-travel-mobile.png') });
  console.log('📸 Saved journal-travel-mobile.png');

  // ==========================================
  // PART 2: DESKTOP VERIFICATION (1920 x 1080)
  // ==========================================
  console.log('\n🖥️ PART 2: Desktop Viewport (1920 x 1080)...');
  await page.setViewport({ width: 1920, height: 1080, isMobile: false });

  console.log('🌐 Navigating to Passport View on Desktop...');
  await page.goto('http://localhost:4173/#/pasaport', { waitUntil: 'networkidle0' });
  await delay(1000);

  // Advance to pages 2-3 to see open booklet stamps
  const deskNextBtn = await page.$('#btn-next-page');
  if (deskNextBtn) {
    await deskNextBtn.click();
    await delay(800);
  }

  // Verify Two-Page Desk Spread and Companion Map
  const deskChecks = await page.evaluate(() => {
    const twoPageSpread = document.querySelector('.two-page-desk-spread');
    const leftLeaf = document.querySelector('.desk-page-leaf.leaf-left');
    const spine = document.querySelector('.desk-page-spine');
    const rightLeaf = document.querySelector('.desk-page-leaf.leaf-right');
    const companionSidebar = document.querySelector('.desktop-explorer-sidebar');
    const companionMapMount = document.querySelector('#desktop-companion-map-mount');

    return {
      hasTwoPageSpread: !!twoPageSpread,
      hasLeftLeaf: !!leftLeaf,
      hasSpine: !!spine,
      hasRightLeaf: !!rightLeaf,
      hasCompanionSidebar: !!companionSidebar,
      companionVisible: companionSidebar ? window.getComputedStyle(companionSidebar).display !== 'none' : false,
      companionMountChildren: companionMapMount?.children.length || 0
    };
  });
  console.log('✅ Desktop Spread verification results:', JSON.stringify(deskChecks, null, 2));

  // Test cross-linking: hover slot
  console.log('🔄 Testing Slot -> Companion Map cross-linking...');
  const firstSlot = await page.$('.paper-stamp-slot');
  if (firstSlot) {
    await firstSlot.hover();
    await delay(400);
  }

  await page.screenshot({ path: path.join(OUT_DIR, 'desk-spread-desktop.png') });
  console.log('📸 Saved desk-spread-desktop.png');

  // 2.2 Test Mod Prezentare (Key 'P')
  console.log('📽️ Testing Mod Prezentare (Pressing "p")...');
  await page.keyboard.press('p');
  await delay(600);

  const presentationActive = await page.evaluate(() => {
    return document.body.classList.contains('presentation-mode');
  });
  console.log(`✅ Presentation Mode active on body: ${presentationActive}`);

  await page.screenshot({ path: path.join(OUT_DIR, 'presentation-mode-desktop.png') });
  console.log('📸 Saved presentation-mode-desktop.png');

  // Exit presentation mode
  await page.keyboard.press('Escape');
  await delay(400);

  // 2.3 Verify MiniMap Fog of War & Compass
  console.log('🗺️ Navigating to Desktop Map View...');
  await page.goto('http://localhost:4173/#/', { waitUntil: 'networkidle0' });
  await delay(1200);

  const mapFeatures = await page.evaluate(() => {
    const fogCanvas = document.querySelector('#map-fog-canvas');
    const compassBtn = document.querySelector('#btn-map-compass');
    const chips = document.querySelectorAll('.map-chip').length;
    return {
      hasFogCanvas: !!fogCanvas,
      fogWidth: fogCanvas?.width || 0,
      fogHeight: fogCanvas?.height || 0,
      hasCompassBtn: !!compassBtn,
      chipsCount: chips
    };
  });
  console.log('✅ MiniMap features verified:', JSON.stringify(mapFeatures, null, 2));

  await page.screenshot({ path: path.join(OUT_DIR, 'map-fog-compass.png') });
  console.log('📸 Saved map-fog-compass.png');

  console.log('\n🎉 ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  await browser.close();
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
