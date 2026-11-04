import puppeteer from 'puppeteer';

const chromePath = 'C:\\Users\\Edy\\.cache\\puppeteer\\chrome\\win64-156.0.8078.47\\chrome-win64\\chrome.exe';

const STORY_IDS = [
  'a-chei-rau',
  'a-varful-arcanu',
  'a-drum-priveliste',
  'a-poteca-padure',
  'a-interior-candelabru',
  'b-port-popular-ansamblu',
  'b-dans-hora',
  'b-mesteguri-torsul-lanii',
  'b-gastronomie-locala',
  'c-personalitate-locala',
  'd-rachiti-troite-lemn',
  'd-poveste-comunitate'
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(`[PAGE_ERROR] ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      pageErrors.push(`[CONSOLE_ERROR] ${msg.text()}`);
    }
  });

  // Navigate to root first
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  const skipBtn = await page.$('#intro-skip-button');
  if (skipBtn) await skipBtn.click();
  await new Promise(r => setTimeout(r, 600));

  console.log('Testing all 12 stories sequentially...');

  for (const id of STORY_IDS) {
    const storyUrl = `http://localhost:4173/#/poveste/${id}`;
    await page.evaluate((targetUrl) => {
      window.location.hash = targetUrl.split('#')[1];
    }, storyUrl);

    await new Promise(r => setTimeout(r, 600));

    const check = await page.evaluate((expectedId) => {
      const viewer = document.querySelector('#story-viewer');
      const title = document.querySelector('.story-header-title')?.innerText;
      const mediaImg = document.querySelector('.story-media-img')?.getAttribute('src');
      const errorTitle = document.querySelector('.unlock-title')?.innerText;
      return {
        id: expectedId,
        hasViewer: !!viewer,
        title,
        mediaImg,
        errorTitle
      };
    }, id);

    console.log(`Story ${id}:`, check.hasViewer ? `OK - "${check.title}"` : `FAILED - Error: ${check.errorTitle}`);
  }

  console.log('\nTotal errors encountered:', pageErrors.length);
  pageErrors.forEach(e => console.log('  ', e));

  await browser.close();
})();
