/**
 * Profile Intro "Before" — Etapa 0
 * Uses Chrome DevTools Protocol via Puppeteer with:
 *  - CPU 4x Throttling
 *  - Fast 4G Network Emulation
 *  - Mobile Viewport (390x844) & Desktop Viewport (1920x1080)
 * Measures: Average FPS, Min FPS, Long Tasks (>50ms), Network Transfer, Frame Delays
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Users\\Edy\\.cache\\puppeteer\\chrome\\win64-156.0.8078.47\\chrome-win64\\chrome.exe';
const OUT_DIR = 'C:\\Users\\Edy\\.gemini\\antigravity\\brain\\c3aea67c-8c5a-4a88-8408-2e6ff0f4e36a\\profiling_etapa0';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function profileViewport({ name, width, height, isMobile }) {
  console.log(`\n======================================================`);
  console.log(`🔍 Profiling Intro [${name}] (${width}x${height}, isMobile=${isMobile})`);
  console.log(`======================================================`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu-sandbox',
      '--enable-precise-memory-info'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile, hasTouch: isMobile });

  const client = await page.target().createCDPSession();

  // Enable Network and apply Fast 4G throttling
  // Fast 4G: 20ms RTT, 4 Mbps download, 3 Mbps upload
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 20,
    downloadThroughput: (4 * 1024 * 1024) / 8, // 4 Mbps
    uploadThroughput: (3 * 1024 * 1024) / 8     // 3 Mbps
  });

  // Enable CPU 4x Throttling
  console.log(`⚙️ Applying CPU 4x throttling...`);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  // Track network resources
  const resources = { js: 0, css: 0, img: 0, font: 0, other: 0, total: 0 };
  client.on('Network.loadingFinished', ({ encodedDataLength }) => {
    resources.total += encodedDataLength || 0;
  });
  client.on('Network.responseReceived', ({ response }) => {
    const mime = (response.mimeType || '').toLowerCase();
    const len = response.encodedDataLength || 0;
    if (mime.includes('javascript')) resources.js += len;
    else if (mime.includes('css')) resources.css += len;
    else if (mime.includes('image')) resources.img += len;
    else if (mime.includes('font')) resources.font += len;
    else resources.other += len;
  });

  // Inject performance observer before any script runs
  await page.evaluateOnNewDocument(() => {
    window.__perfData = {
      fpsSamples: [],
      longTasks: [],
      startTime: 0,
      endTime: 0
    };

    // Long Tasks observer (>50ms)
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__perfData.longTasks.push({
            name: entry.name,
            duration: Math.round(entry.duration),
            startTime: Math.round(entry.startTime)
          });
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {}

    // FPS / Frame Duration Tracker during first 4 seconds
    let lastTime = performance.now();
    window.__perfData.startTime = lastTime;

    function measureFrame(now) {
      const delta = now - lastTime;
      lastTime = now;
      if (delta > 0) {
        const fps = Math.min(1000 / delta, 60);
        window.__perfData.fpsSamples.push({ fps, delta });
      }
      if (now - window.__perfData.startTime < 4000) {
        requestAnimationFrame(measureFrame);
      } else {
        window.__perfData.endTime = now;
      }
    }
    requestAnimationFrame(measureFrame);
  });

  console.log(`🌐 Navigating to http://localhost:4173/ ...`);
  const navStart = Date.now();
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });

  // Wait 1.5s into the intro and capture screenshot
  await new Promise(r => setTimeout(r, 1200));
  const shotPath = path.join(OUT_DIR, `intro-before-${name.toLowerCase()}.png`);
  await page.screenshot({ path: shotPath });
  console.log(`📸 Screenshot captured: ${shotPath}`);

  // Wait another 3s to let the full intro sequence run under 4x CPU
  await new Promise(r => setTimeout(r, 3000));

  // Extract collected metrics
  const perfData = await page.evaluate(() => {
    const samples = window.__perfData.fpsSamples || [];
    const deltas = samples.map(s => s.delta);
    const fpsList = samples.map(s => s.fps);
    const avgFps = fpsList.length > 0 ? (fpsList.reduce((a, b) => a + b, 0) / fpsList.length) : 0;
    const minFps = fpsList.length > 0 ? Math.min(...fpsList) : 0;
    const maxDelta = deltas.length > 0 ? Math.max(...deltas) : 0;

    return {
      avgFps: Math.round(avgFps * 10) / 10,
      minFps: Math.round(minFps * 10) / 10,
      maxFrameDelayMs: Math.round(maxDelta),
      totalFrames: samples.length,
      longTasks: window.__perfData.longTasks || []
    };
  });

  await browser.close();

  const totalLongTaskDuration = perfData.longTasks.reduce((acc, t) => acc + t.duration, 0);

  console.log(`📊 Results for ${name}:`);
  console.log(`   - FPS Mediu: ${perfData.avgFps} fps (Țintă: ≥ 55 fps)`);
  console.log(`   - FPS Minim: ${perfData.minFps} fps`);
  console.log(`   - Cadru Maxim (Jank Spike): ${perfData.maxFrameDelayMs} ms`);
  console.log(`   - Long Tasks (>50ms): ${perfData.longTasks.length} task-uri (Total: ${totalLongTaskDuration} ms)`);
  if (perfData.longTasks.length > 0) {
    perfData.longTasks.forEach((t, i) => {
      console.log(`     #${i + 1}: ${t.duration}ms la t=${t.startTime}ms`);
    });
  }
  console.log(`   - Resurse încărcate: JS=${Math.round(resources.js/1024)}KB, CSS=${Math.round(resources.css/1024)}KB, Img=${Math.round(resources.img/1024)}KB, Total=${Math.round(resources.total/1024)}KB`);

  return {
    name,
    width,
    height,
    isMobile,
    avgFps: perfData.avgFps,
    minFps: perfData.minFps,
    maxFrameDelayMs: perfData.maxFrameDelayMs,
    totalFrames: perfData.totalFrames,
    longTasksCount: perfData.longTasks.length,
    totalLongTaskDuration,
    longTasks: perfData.longTasks,
    resources,
    screenshot: shotPath
  };
}

async function main() {
  const mobile = await profileViewport({ name: 'Mobile', width: 390, height: 844, isMobile: true });
  const desktop = await profileViewport({ name: 'Desktop', width: 1920, height: 1080, isMobile: false });

  const summary = {
    timestamp: new Date().toISOString(),
    mobile,
    desktop
  };

  fs.writeFileSync(path.join(OUT_DIR, 'summary-before.json'), JSON.stringify(summary, null, 2));
  console.log(`\n✅ Etapa 0 profiling complete! Saved summary-before.json`);
}

main().catch(err => {
  console.error('❌ Error during Etapa 0 profiling:', err);
  process.exit(1);
});
