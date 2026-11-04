import puppeteer from 'puppeteer';

const chromePath = 'C:\\Users\\Edy\\.cache\\puppeteer\\chrome\\win64-156.0.8078.47\\chrome-win64\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE_ERROR] ${err.message}`));

  console.log('Navigating to http://localhost:4173/#/poveste/c-personalitate-locala ...');
  await page.goto('http://localhost:4173/#/poveste/c-personalitate-locala', { waitUntil: 'networkidle0', timeout: 15000 });

  await new Promise(r => setTimeout(r, 1500));

  const content = await page.evaluate(() => {
    const stage = document.querySelector('.story-stage');
    const title = document.querySelector('.story-header-title');
    const unlockTitle = document.querySelector('.unlock-title');
    return {
      hasViewer: !!document.querySelector('#story-viewer'),
      titleText: title ? title.innerText : null,
      stageHtml: stage ? stage.innerHTML.slice(0, 300) : null,
      unlockTitle: unlockTitle ? unlockTitle.innerText : null,
      bodyClasses: document.body.className
    };
  });

  console.log('Story result:', JSON.stringify(content, null, 2));
  console.log('Console logs:');
  consoleLogs.forEach(l => console.log('  ', l));

  await browser.close();
})();
