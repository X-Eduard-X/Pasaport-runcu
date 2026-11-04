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

  // 1. Mobile Living Cover Capture
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(s => {
    sessionStorage.setItem('runcu_intro_completed_session', 'true');
    localStorage.setItem('pasaport_runcu_v1', JSON.stringify(s));
  }, state);
  await page.goto('http://localhost:4173/#/pasaport', { waitUntil: 'networkidle0' });
  await delay(800);

  // Click 'Copertă' header button to toggle cover closed
  const toggleBtn = await page.$('#btn-toggle-cover');
  if (toggleBtn) {
    await toggleBtn.click();
    await delay(700);
  }

  await page.screenshot({ path: path.join(OUT_DIR, 'living-cover-mobile.png') });
  console.log('✅ Captured living-cover-mobile.png');

  await browser.close();
}

run().catch(console.error);
