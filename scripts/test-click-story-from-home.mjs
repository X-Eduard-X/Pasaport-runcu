import puppeteer from 'puppeteer';

const chromePath = 'C:\\Users\\Edy\\.cache\\puppeteer\\chrome\\win64-156.0.8078.47\\chrome-win64\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE_ERROR] ${err.message}`));

  console.log('Navigating to http://localhost:4173/ ...');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0', timeout: 15000 });

  await new Promise(r => setTimeout(r, 600));

  // Skip intro if present
  const skipBtn = await page.$('#intro-skip-button');
  if (skipBtn) {
    console.log('Clicking #intro-skip-button...');
    await skipBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  } else {
    const minBtn = await page.$('#btn-intro-enter-minimal');
    if (minBtn) {
      console.log('Clicking minimal enter button...');
      await minBtn.click();
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Check HomeView loaded
  const homeState = await page.evaluate(() => {
    return {
      url: window.location.href,
      hasPointsSection: !!document.querySelector('.points-section'),
      cardCount: document.querySelectorAll('.point-card').length,
      firstStoryHref: document.querySelector('.point-card a[href^="#/poveste/"]')?.getAttribute('href')
    };
  });
  console.log('Home state:', homeState);

  // Click the first story button
  console.log('Clicking first story button...');
  await page.click('.point-card a[href^="#/poveste/"]');
  await new Promise(r => setTimeout(r, 1500));

  const story1State = await page.evaluate(() => {
    return {
      url: window.location.href,
      hasViewer: !!document.querySelector('#story-viewer'),
      title: document.querySelector('.story-header-title')?.innerText || null,
      slideImg: document.querySelector('.story-media-img')?.getAttribute('src') || null
    };
  });
  console.log('Story 1 State:', story1State);

  // Close story
  console.log('Closing story with close button...');
  await page.click('#btn-close-story');
  await new Promise(r => setTimeout(r, 1000));

  // Click on the Canavoiu story link (#card-c-personalitate-locala)
  console.log('Clicking Canavoiu story link...');
  const canavoiuBtn = await page.$('#card-c-personalitate-locala a[href^="#/poveste/"]');
  if (canavoiuBtn) {
    await canavoiuBtn.click();
    await new Promise(r => setTimeout(r, 1500));
    const canavoiuState = await page.evaluate(() => {
      return {
        url: window.location.href,
        hasViewer: !!document.querySelector('#story-viewer'),
        title: document.querySelector('.story-header-title')?.innerText || null,
        slideImg: document.querySelector('.story-media-img')?.getAttribute('src') || null
      };
    });
    console.log('Canavoiu Story State:', canavoiuState);
  } else {
    console.log('Could not find #card-c-personalitate-locala button!');
  }

  console.log('Console errors/warnings:');
  logs.filter(l => l.includes('error') || l.includes('PAGE_ERROR') || l.includes('warn')).forEach(l => console.log('  ', l));

  await browser.close();
})();
