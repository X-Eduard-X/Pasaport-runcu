import puppeteer from 'puppeteer';

const CHROME_PATH = 'C:/Users/Edy/.cache/puppeteer/chrome/win64-156.0.8078.47/chrome-win64/chrome.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const errors = [];
  const logs = [];
  page.on('pageerror', err => errors.push(err.toString()));
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));

  console.log('1. Loading Home page...');
  await page.goto('http://localhost:4173/#/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => sessionStorage.setItem('runcu_intro_completed_session', 'true'));
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Check if intro is blocking the screen
  const introEl = await page.evaluate(() => {
    const el = document.querySelector('.intro-cinematic-overlay');
    return el ? {
      display: getComputedStyle(el).display,
      opacity: getComputedStyle(el).opacity,
      pointerEvents: getComputedStyle(el).pointerEvents,
      zIndex: getComputedStyle(el).zIndex
    } : null;
  });
  console.log('Intro overlay state:', introEl);

  // Check element at center of screen
  const topElAtCenter = await page.evaluate(() => {
    const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    return el ? { tagName: el.tagName, className: el.className, id: el.id } : null;
  });
  console.log('Element at center of screen:', topElAtCenter);

  // Scroll down to cards
  await page.evaluate(() => {
    const card = document.querySelector('.point-card');
    if (card) card.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 300));

  // Try clicking first story button
  console.log('2. Trying to click first story button on Home page...');
  const firstStoryBtn = await page.$('.point-card a.btn-sheet-primary');
  console.log('Found firstStoryBtn?', !!firstStoryBtn);
  if (firstStoryBtn) {
    const href = await page.evaluate(el => el.getAttribute('href'), firstStoryBtn);
    console.log('Button href:', href);
    await firstStoryBtn.click();
    await new Promise(r => setTimeout(r, 800));
    console.log('Current URL after click:', page.url());
  }

  // Check if StoryView is mounted
  const storyMounted = await page.evaluate(() => {
    const wrap = document.querySelector('.story-viewer-wrap');
    return {
      exists: !!wrap,
      title: document.querySelector('.story-hdr-title')?.textContent,
      visible: wrap ? getComputedStyle(wrap).display : 'none'
    };
  });
  console.log('Story mounted state:', storyMounted);

  // Also check story for c-personalitate-locala
  console.log('3. Navigating to c-personalitate-locala...');
  await page.goto('http://localhost:4173/#/poveste/c-personalitate-locala', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  const cStoryMounted = await page.evaluate(() => {
    const wrap = document.querySelector('.story-viewer-wrap');
    return {
      exists: !!wrap,
      title: document.querySelector('.story-hdr-title')?.textContent,
      visible: wrap ? getComputedStyle(wrap).display : 'none',
      appHtml: document.querySelector('#app')?.innerHTML?.slice(0, 300)
    };
  });
  console.log('c-personalitate-locala state:', cStoryMounted);

  console.log('Errors:', errors);
  console.log('Console logs count:', logs.length);
  if (errors.length > 0) {
    console.log('Error details:', errors);
  }

  await browser.close();
}

main().catch(console.error);
