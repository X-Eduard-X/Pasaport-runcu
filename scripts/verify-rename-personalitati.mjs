import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const OUT_DIR = 'C:/Users/Edy/.gemini/antigravity/brain/c3aea67c-8c5a-4a88-8408-2e6ff0f4e36a/screenshots_rename_personalitati';
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

  // 1. Home View
  console.log('1. Checking Home View...');
  await page.goto('http://localhost:4173/#/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    sessionStorage.setItem('runcu_intro_completed_session', 'true');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUT_DIR, '1-home-hero.png') });

  // Scroll to footer
  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT_DIR, '2-home-footer.png') });

  // 2. Story View: c-personalitate-locala (Personalități)
  console.log('2. Checking Story View: c-personalitate-locala...');
  await page.goto('http://localhost:4173/#/poveste/c-personalitate-locala', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUT_DIR, '3-story-slide1-maria-apostol.png') });

  // Next slide -> Ion Cănăvoiu
  const nextZone = await page.$('#zone-next');
  if (nextZone) {
    await nextZone.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, '4-story-slide2-ion-canavoiu.png') });

    // Next slide -> General Constantin Șandru / Liceul Tehnologic
    await nextZone.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, '5-story-slide3-general-sandru.png') });
  }

  // Also open gallery to show all 5 images
  const galleryBtn = await page.$('#btn-open-gallery');
  if (galleryBtn) {
    await galleryBtn.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUT_DIR, '5b-story-gallery-modal.png') });
    const closeGal = await page.$('#btn-close-gallery');
    if (closeGal) await closeGal.click();
    await new Promise(r => setTimeout(r, 300));
  }

  // Scroll down to Quiz
  await page.evaluate(() => {
    const quiz = document.querySelector('.story-quiz-section');
    if (quiz) quiz.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT_DIR, '6-story-quiz-canavoiu.png') });

  // 3. Passport View
  console.log('3. Checking Passport View...');
  await page.goto('http://localhost:4173/#/pasaport', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUT_DIR, '7-passport-page0.png') });

  const toggleCoverBtn = await page.$('#btn-toggle-cover');
  if (toggleCoverBtn) {
    await toggleCoverBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, '8-passport-cover.png') });
  }

  // 4. Certificate View
  console.log('4. Checking Certificate View...');
  await page.goto('http://localhost:4173/#/certificat', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUT_DIR, '9-certificate.png') });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

main().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});
