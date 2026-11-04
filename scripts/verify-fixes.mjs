import puppeteer from 'puppeteer';
import fs from 'node:fs';

async function verify() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const report = {};

  // 1. Verify Intro Screen & Icons
  console.log('[1] Checking Intro Screen & Icons...');
  await page.goto('http://localhost:4173/#/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  report.introIcons = await page.evaluate(() => {
    const icons = Array.from(document.querySelectorAll('.intro-feature-icon svg')).map(s => {
      const use = s.querySelector('use');
      return {
        href: use?.getAttribute('href'),
        width: s.getAttribute('width'),
        height: s.getAttribute('height'),
        boundingRect: s.getBoundingClientRect()
      };
    });
    return icons;
  });

  await page.screenshot({ path: 'test-intro-icons-fixed.png' });

  // 2. Dismiss Intro and Check Map & Controls
  console.log('[2] Checking Map & Floating Controls...');
  await page.evaluate(() => {
    const btn = document.getElementById('btn-start-expedition');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1600));

  report.mapControls = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.btn-map-ctrl')).map(b => {
      const svg = b.querySelector('svg');
      const use = svg?.querySelector('use');
      return {
        id: b.id,
        iconHref: use?.getAttribute('href'),
        svgWidth: svg?.getAttribute('width'),
        svgHeight: svg?.getAttribute('height'),
        rect: b.getBoundingClientRect()
      };
    });
    return btns;
  });

  report.mapCenterAndBounds = await page.evaluate(() => {
    const el = document.getElementById('osm-map-container');
    const villages = Array.from(document.querySelectorAll('.osm-village-badge')).map(v => ({
      name: v.textContent.trim(),
      rect: v.getBoundingClientRect()
    }));
    const markers = document.querySelectorAll('.osm-marker-wrap').length;
    return {
      mapHeight: el?.getBoundingClientRect().height,
      villagesCount: villages.length,
      villagesPositions: villages.slice(0, 4),
      markersCount: markers
    };
  });

  await page.screenshot({ path: 'test-map-viewport-fixed.png' });

  // 3. Check Story Slide 4 for [TEXT AICI]
  console.log('[3] Checking Story Slide 4 for [TEXT AICI]...');
  await page.goto('http://localhost:4173/#/poveste/a-chei-rau', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Advance to slide 4 (index 3)
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      const rightZone = document.getElementById('zone-next');
      if (rightZone) rightZone.click();
    });
    await new Promise(r => setTimeout(r, 300));
  }

  report.storySlide4 = await page.evaluate(() => {
    const text = document.querySelector('.story-narrative-text')?.textContent;
    const caption = document.querySelector('.story-photo-caption')?.textContent;
    return {
      hasPlaceholder: text?.includes('[TEXT AICI]'),
      narrativeText: text,
      photoCaption: caption
    };
  });

  await page.screenshot({ path: 'test-story-slide4-fixed.png' });

  console.log('--- VERIFICATION REPORT ---');
  console.log(JSON.stringify(report, null, 2));

  await browser.close();
}

verify().catch(console.error);
