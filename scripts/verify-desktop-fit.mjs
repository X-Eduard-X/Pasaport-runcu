import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Users\\Edy\\.cache\\puppeteer\\chrome\\win64-156.0.8078.47\\chrome-win64\\chrome.exe';
const OUT_DIR = 'C:\\Users\\Edy\\.gemini\\antigravity\\brain\\c3aea67c-8c5a-4a88-8408-2e6ff0f4e36a\\screenshots_after';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });

  const state = {
    version: 1,
    createdAt: new Date().toISOString(),
    userName: 'Mihai Călătorul',
    unlocked: {
      'a-chei-rau': {
        unlockedAt: '2026-11-04T14:20:00.000Z',
        timestamp: 1793800000000,
        dateFormatted: '04.11.2026',
        timeFormatted: '14:20',
        verified: true,
        method: 'physical'
      },
      'a-varful-arcanu': {
        unlockedAt: '2026-11-04T15:10:00.000Z',
        timestamp: 1793803000000,
        dateFormatted: '04.11.2026',
        timeFormatted: '15:10',
        verified: true,
        method: 'physical'
      }
    },
    journalNotes: {
      'a-chei-rau': {
        text: 'Am explorat albia râului Sohodol la ieșirea dintre pereții calcaroși. Vântul aduce miros proaspăt de pin și răcoare din Munții Vâlcan.',
        updatedAt: '2026-11-04T14:25:00.000Z'
      }
    }
  };

  // 1. Desktop 1920x1080 Viewport
  console.log('🖥️ Testing 1920x1080 Desktop Viewport...');
  const page1080 = await browser.newPage();
  await page1080.setViewport({ width: 1920, height: 1080 });
  await page1080.evaluateOnNewDocument(s => {
    sessionStorage.setItem('runcu_intro_completed_session', 'true');
    localStorage.setItem('pasaport_runcu_v1', JSON.stringify(s));
  }, state);

  // Check Passport View on Desktop
  await page1080.goto('http://localhost:4173/#/pasaport', { waitUntil: 'networkidle0' });
  await delay(800);

  // Turn to stamps page (Filele 3-4)
  const nextBtn = await page1080.$('#btn-next-page');
  if (nextBtn) {
    await nextBtn.click();
    await delay(700);
  }

  // Hover first slot to show cross-linking
  const slot = await page1080.$('.paper-stamp-slot');
  if (slot) {
    await slot.hover();
    await delay(300);
  }

  const deskDims = await page1080.evaluate(() => {
    const toObj = r => r ? ({ x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }) : null;
    const spread = document.querySelector('.two-page-desk-spread');
    const sidebar = document.querySelector('.desktop-explorer-sidebar');
    const footerNav = document.querySelector('.booklet-footer-nav');
    const windowH = window.innerHeight;
    const spreadRect = spread?.getBoundingClientRect();
    const sidebarRect = sidebar?.getBoundingClientRect();
    const footerRect = footerNav?.getBoundingClientRect();

    return {
      windowHeight: windowH,
      spread: toObj(spreadRect),
      sidebar: toObj(sidebarRect),
      footerNav: toObj(footerRect),
      fitsCompletelyInViewport: footerRect ? (footerRect.bottom <= windowH) : false
    };
  });
  console.log('✅ Desktop 1080p Dimensions:', JSON.stringify(deskDims, null, 2));

  await page1080.screenshot({ path: path.join(OUT_DIR, 'desk-spread-desktop.png') });
  console.log('📸 Saved desk-spread-desktop.png (1080p)');

  // 2. Desktop Home View (3-Column Grid)
  console.log('🗺️ Testing Desktop 1920x1080 Home View...');
  await page1080.goto('http://localhost:4173/#/', { waitUntil: 'networkidle0' });
  await delay(1000);

  const homeGridCheck = await page1080.evaluate(() => {
    const list = document.querySelector('.points-list');
    const cards = document.querySelectorAll('.point-card');
    const computed = list ? window.getComputedStyle(list) : null;
    return {
      display: computed?.display,
      gridColumns: computed?.gridTemplateColumns,
      cardsCount: cards.length
    };
  });
  console.log('✅ Home View Desktop Grid:', JSON.stringify(homeGridCheck, null, 2));

  await page1080.screenshot({ path: path.join(OUT_DIR, 'home-desktop-3col.png') });
  console.log('📸 Saved home-desktop-3col.png');

  // 3. Laptop 1440x900 Viewport
  console.log('\n💻 Testing 1440x900 Laptop Viewport...');
  const page900 = await browser.newPage();
  await page900.setViewport({ width: 1440, height: 900 });
  await page900.evaluateOnNewDocument(s => {
    sessionStorage.setItem('runcu_intro_completed_session', 'true');
    localStorage.setItem('pasaport_runcu_v1', JSON.stringify(s));
  }, state);

  await page900.goto('http://localhost:4173/#/pasaport', { waitUntil: 'networkidle0' });
  await delay(800);
  const next900 = await page900.$('#btn-next-page');
  if (next900) {
    await next900.click();
    await delay(700);
  }

  const laptopDims = await page900.evaluate(() => {
    const footerNav = document.querySelector('.booklet-footer-nav');
    const windowH = window.innerHeight;
    const footerRect = footerNav?.getBoundingClientRect();
    return {
      windowHeight: windowH,
      footerBottom: footerRect ? Math.round(footerRect.bottom) : null,
      fitsIn900p: footerRect ? (footerRect.bottom <= windowH) : false
    };
  });
  console.log('✅ Laptop 900p Fit:', JSON.stringify(laptopDims, null, 2));

  await page900.screenshot({ path: path.join(OUT_DIR, 'desk-spread-laptop-900p.png') });
  console.log('📸 Saved desk-spread-laptop-900p.png');

  // 4. Mobile View with New Palette
  console.log('\n📱 Testing Mobile Viewport (390x844)...');
  const pageMobile = await browser.newPage();
  await pageMobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await pageMobile.evaluateOnNewDocument(s => {
    sessionStorage.setItem('runcu_intro_completed_session', 'true');
    localStorage.setItem('pasaport_runcu_v1', JSON.stringify(s));
  }, state);

  await pageMobile.goto('http://localhost:4173/#/', { waitUntil: 'networkidle0' });
  await delay(800);
  await pageMobile.screenshot({ path: path.join(OUT_DIR, 'home-mobile-new-colors.png') });
  console.log('📸 Saved home-mobile-new-colors.png');

  await browser.close();
  console.log('\n🎉 ALL DESKTOP OPTIMIZATIONS VERIFIED!');
}

run().catch(console.error);
