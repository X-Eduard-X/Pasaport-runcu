import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Users\\Edy\\.cache\\puppeteer\\chrome\\win64-156.0.8078.47\\chrome-win64\\chrome.exe';
const artifactDir = 'C:\\Users\\Edy\\.gemini\\antigravity\\brain\\c3aea67c-8c5a-4a88-8408-2e6ff0f4e36a\\screenshots_fix_stories';

if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[CONSOLE_ERROR] ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`[PAGE_ERROR] ${err.message}`));

  console.log('1. Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // Handle intro
  await new Promise(r => setTimeout(r, 600));
  const skipBtn = await page.$('#intro-skip-button');
  if (skipBtn) {
    console.log('Skipping intro...');
    await skipBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  }

  await page.screenshot({ path: path.join(artifactDir, '1-home-ready.png') });
  console.log('Screenshot 1: Home view ready');

  // 2. Click on First Story: a-chei-rau
  console.log('2. Clicking first story (a-chei-rau)...');
  await page.click('.point-card a[href="#/poveste/a-chei-rau"]');
  await new Promise(r => setTimeout(r, 1200));

  const story1Title = await page.$eval('.story-header-title', el => el.innerText);
  console.log('Opened Story 1 Title:', story1Title);
  await page.screenshot({ path: path.join(artifactDir, '2-story-chei-sohodolului.png') });

  // Close Story 1
  console.log('Closing Story 1...');
  await page.click('#btn-close-story');
  await new Promise(r => setTimeout(r, 800));

  // 3. Click on Festival & Ion Canavoiu Story: c-personalitate-locala
  console.log('3. Clicking Canavoiu story (c-personalitate-locala)...');
  await page.click('#card-c-personalitate-locala a[href^="#/poveste/"]');
  await new Promise(r => setTimeout(r, 1200));

  const canavoiuTitle = await page.$eval('.story-header-title', el => el.innerText);
  console.log('Opened Canavoiu Story Title:', canavoiuTitle);
  await page.screenshot({ path: path.join(artifactDir, '3-story-canavoiu-slide1.png') });

  // Advance to slide 2 (Portret)
  console.log('Advancing to Slide 2 (Portret)...');
  await page.click('#zone-next');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(artifactDir, '4-story-canavoiu-slide2.png') });

  // Advance to slide 3 (Atelier Runcu)
  console.log('Advancing to Slide 3 (Atelier)...');
  await page.click('#zone-next');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(artifactDir, '5-story-canavoiu-slide3.png') });

  // Close Canavoiu Story
  console.log('Closing Canavoiu Story...');
  await page.click('#btn-close-story');
  await new Promise(r => setTimeout(r, 800));

  // 4. Test opening story from Mini-Map bottom sheet
  console.log('4. Testing opening story from Mini-Map bottom sheet...');
  // Click on the first marker in leaflet
  const marker = await page.$('.osm-custom-div-icon');
  if (marker) {
    await marker.click();
    await new Promise(r => setTimeout(r, 800));
    const sheetStoryBtn = await page.$('#sheet-content a.btn-sheet-primary');
    if (sheetStoryBtn) {
      console.log('Clicking story button inside Mini-Map bottom sheet...');
      await sheetStoryBtn.click();
      await new Promise(r => setTimeout(r, 1200));
      const mapStoryTitle = await page.$eval('.story-header-title', el => el.innerText);
      console.log('Opened Story from Map Title:', mapStoryTitle);
      await page.screenshot({ path: path.join(artifactDir, '6-story-from-map.png') });
      await page.click('#btn-close-story');
      await new Promise(r => setTimeout(r, 800));
    }
  }

  // 5. Test opening story from Passport View
  console.log('5. Navigating to #/pasaport ...');
  await page.evaluate(() => { window.location.hash = '#/pasaport'; });
  await new Promise(r => setTimeout(r, 1000));

  // Open booklet if cover is visible
  const openBookletBtn = await page.$('#btn-open-booklet');
  if (openBookletBtn) {
    await page.evaluate(el => el.click(), openBookletBtn);
    await new Promise(r => setTimeout(r, 600));
  }

  // Go to page 1 (Category A stamps)
  const nextBtn = await page.$('#btn-next-page');
  if (nextBtn) {
    await page.evaluate(el => el.click(), nextBtn);
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('Clicking stamp slot story link on Passport page 1...');
  const slotClicked = await page.evaluate(() => {
    const link = document.querySelector('.paper-stamp-slot a.slot-link-wrapper');
    if (link) {
      link.click();
      return true;
    }
    return false;
  });

  if (slotClicked) {
    await new Promise(r => setTimeout(r, 1200));
    const passportStoryTitle = await page.$eval('.story-header-title', el => el.innerText);
    console.log('Opened Story from Passport Title:', passportStoryTitle);
    await page.screenshot({ path: path.join(artifactDir, '7-story-from-passport.png') });
    await page.click('#btn-close-story');
    await new Promise(r => setTimeout(r, 800));
  }

  // 6. Test on Mobile Viewport (iPhone 14 / 390x844)
  console.log('6. Testing Mobile Viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.evaluate(() => { window.location.hash = '#/'; });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(artifactDir, '8-mobile-home.png') });

  // Open Canavoiu story on mobile
  console.log('Opening Canavoiu story on mobile...');
  await page.evaluate(() => {
    document.querySelector('#card-c-personalitate-locala a[href^="#/poveste/"]')?.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const mobileStoryTitle = await page.$eval('.story-header-title', el => el.innerText);
  console.log('Mobile Story Title:', mobileStoryTitle);
  await page.screenshot({ path: path.join(artifactDir, '9-mobile-story.png') });

  console.log('\n--- VERIFICATION COMPLETE ---');
  console.log('Total errors:', errors.length);
  errors.forEach(e => console.log('  ', e));

  await browser.close();
})();
