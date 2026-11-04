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
  console.log('🚀 Launching Puppeteer with Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  console.log('🌐 Navigating to http://localhost:4173/ ...');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await delay(800);

  // If intro modal is visible, dismiss it by clicking "Explorează direct" or "Deschide Jurnalul"
  const exploreDirectBtn = await page.$('#btn-explore-direct');
  if (exploreDirectBtn) {
    console.log('🎬 Dismissing cinematic intro...');
    await exploreDirectBtn.click();
    await delay(500);
  } else {
    const startBtn = await page.$('#btn-start-expedition');
    if (startBtn) {
      console.log('🎬 Dismissing cinematic intro via start btn...');
      await startBtn.click();
      await delay(500);
    }
  }

  // Take screenshot of home view with the new "Ștampilează" header button
  await page.screenshot({ path: path.join(OUT_DIR, 'vault-home-header.png') });
  console.log('📸 Saved vault-home-header.png');

  // Open the Expedition Vault Modal by clicking the new "Ștampilează" header button
  console.log('🔑 Clicking "#btn-open-code-modal" (Ștampilează)...');
  await page.waitForSelector('#btn-open-code-modal', { visible: true });
  await page.click('#btn-open-code-modal');
  await delay(600);

  // Wait for the modal card to appear
  await page.waitForSelector('.cryptex-housing', { visible: true });

  // Take screenshot of Tab 1: Cifrul Mecanic din Alamă
  await page.screenshot({ path: path.join(OUT_DIR, 'vault-tab-cryptex.png') });
  console.log('📸 Saved vault-tab-cryptex.png');

  // Test cycling tumbler up and down
  console.log('🔄 Testing tumbler arrow up/down...');
  await page.evaluate(() => {
    document.querySelector('.cryptex-dial-col[data-index="0"] .cryptex-arrow-up')?.click();
  });
  await delay(250);
  await page.evaluate(() => {
    document.querySelector('.cryptex-dial-col[data-index="1"] .cryptex-arrow-down')?.click();
  });
  await delay(250);

  // Test clicking one of the field chips (e.g. VXZG48 for Cheile Sohodolului)
  console.log('🏷️ Clicking field chip for VXZG48...');
  await page.evaluate(() => {
    const chip = document.querySelector('.field-chip-btn[data-code="VXZG48"]');
    if (chip) {
      chip.scrollIntoView({ behavior: 'smooth', block: 'center' });
      chip.click();
    }
  });
  await delay(400);
  await page.screenshot({ path: path.join(OUT_DIR, 'vault-cryptex-filled.png') });
  console.log('📸 Saved vault-cryptex-filled.png');

  // Test Tab 2: Lentila Optică
  console.log('🔍 Switching to Tab 2: Lentilă Optică...');
  await page.evaluate(() => {
    document.querySelector('.vault-tab-btn[data-tab="camera"]')?.click();
  });
  await delay(600);
  await page.screenshot({ path: path.join(OUT_DIR, 'vault-tab-camera.png') });
  console.log('📸 Saved vault-tab-camera.png');

  // Test Tab 3: Sigilii Teren
  console.log('🪙 Switching to Tab 3: Sigilii Teren...');
  await page.evaluate(() => {
    document.querySelector('.vault-tab-btn[data-tab="sigilii"]')?.click();
  });
  await delay(600);
  await page.screenshot({ path: path.join(OUT_DIR, 'vault-tab-sigilii.png') });
  console.log('📸 Saved vault-tab-sigilii.png');

  // Test filtering in Sigilii Teren
  console.log('🎯 Testing Sigilii filter...');
  await page.evaluate(() => {
    document.querySelector('.sigil-filter-chip[data-cat="A"]')?.click();
  });
  await delay(350);
  await page.screenshot({ path: path.join(OUT_DIR, 'vault-sigilii-cat-a.png') });
  console.log('📸 Saved vault-sigilii-cat-a.png');

  // Switch back to Cifru and submit code VXZG48 to unlock Cheile Sohodolului!
  console.log('🔓 Unlocking Cheile Sohodolului via Cryptex...');
  await page.evaluate(() => {
    document.querySelector('.vault-tab-btn[data-tab="cifru"]')?.click();
  });
  await delay(400);

  await page.evaluate(() => {
    const chip = document.querySelector('.field-chip-btn[data-code="VXZG48"]');
    if (chip) chip.click();
  });
  await delay(300);

  await page.evaluate(() => {
    document.querySelector('#btn-submit-cryptex')?.click();
  });
  await delay(1400); // wait for stamp impact animation

  // Now we should be on #/stampila/a-chei-rau/fc878be99183f63bf2dcadbe5509c298
  console.log('📍 Current URL after unlock:', page.url());
  await page.screenshot({ path: path.join(OUT_DIR, 'vault-unlocked-stamp.png') });
  console.log('📸 Saved vault-unlocked-stamp.png');

  // Close browser
  await browser.close();
  console.log('🎉 Verification completed successfully!');
}

run().catch(err => {
  console.error('❌ Error during verification:', err);
  process.exit(1);
});
