import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 500, height: 600 });
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          body { margin: 0; background: #0E1814; font-family: sans-serif; color: #fff; padding: 10px; }
          .map-wrap { width: 480px; height: 260px; margin-bottom: 20px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(229,169,60,0.3); }
          .dark-osm .leaflet-tile-pane {
            filter: brightness(0.7) invert(1) contrast(1.2) hue-rotate(200deg) saturate(0.5);
          }
        </style>
      </head>
      <body>
        <h3>1. Natural Clean OSM</h3>
        <div id="map1" class="map-wrap"></div>
        <h3>2. Deep Forest Dark OSM Filter</h3>
        <div id="map2" class="map-wrap dark-osm"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const m1 = L.map('map1', { zoomControl: false }).setView([45.16, 23.15], 12);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m1);
          
          const m2 = L.map('map2', { zoomControl: false }).setView([45.16, 23.15], 12);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m2);
        </script>
      </body>
    </html>
  `;

  await page.setContent(html);
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'test-osm-options.png' });
  console.log('Saved test-osm-options.png');
  await browser.close();
}

run().catch(console.error);
