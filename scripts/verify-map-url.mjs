import puppeteer from 'puppeteer';

const chromePath = 'C:\\Users\\Edy\\.cache\\puppeteer\\chrome\\win64-156.0.8078.47\\chrome-win64\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // Skip intro if present
  const skipBtn = await page.$('#intro-skip-button');
  if (skipBtn) {
    await skipBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }

  const footerLink = await page.$eval('.footer-link-external', el => ({
    text: el.innerText.trim(),
    href: el.getAttribute('href'),
    target: el.getAttribute('target')
  }));

  console.log('Footer Button verification:');
  console.log(JSON.stringify(footerLink, null, 2));

  // Open a waypoint sheet on map
  const marker = await page.$('.osm-custom-div-icon');
  if (marker) {
    await marker.click();
    await new Promise(r => setTimeout(r, 500));
    const sheetMapLink = await page.$eval('.btn-sheet-discreet', el => ({
      text: el.innerText.trim(),
      href: el.getAttribute('href'),
      target: el.getAttribute('target')
    }));
    console.log('Map Bottom Sheet Button verification:');
    console.log(JSON.stringify(sheetMapLink, null, 2));
  }

  await browser.close();
})();
