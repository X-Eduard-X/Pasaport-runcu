/**
 * Print Kit Generator — "Pașaportul Runcului"
 * Generates high-res A4 printable posters (HTML/print-ready) for each stamp point
 * with Error Correction Level H QR codes, category styling, and clear fallback codes.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import QRCode from 'qrcode';
import { APP_CONFIG } from '../src/config.js';
import { CATEGORY_META } from '../src/tokens.js';
import { RUNCU_BOUNDARY_PATH } from '../src/data/boundary.js';

const STAMPS_FILE = path.resolve('public/data/stamps.json');
const OUTPUT_DIR = path.resolve('print-kit');
const QR_OUTPUT_DIR = path.resolve('print-kit/qr');

async function runPrintKit() {
  console.log('[PRINT-KIT] Reading stamps from:', STAMPS_FILE);
  const raw = await fs.readFile(STAMPS_FILE, 'utf8');
  const data = JSON.parse(raw);
  const stamps = Array.isArray(data) ? data : data.stamps;

  // Target base url: CLI argument or config
  const cliUrl = process.argv[2]?.trim();
  const baseUrl = (cliUrl || APP_CONFIG.PASSPORT_URL || 'https://pasaport-runcu.web.app').replace(/\/+$/, '');

  console.log(`[PRINT-KIT] Generating print kit for URL: ${baseUrl}`);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(QR_OUTPUT_DIR, { recursive: true });

  const pagesHtml = [];

  for (const stamp of stamps) {
    const fullQrUrl = `${baseUrl}/#/stampila/${stamp.id}/${stamp.token}`;
    const cat = CATEGORY_META[stamp.category] || CATEGORY_META.A;

    // High error-correction level 'H' (up to 30% damage recovery in physical field)
    const qrSvgString = await QRCode.toString(fullQrUrl, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 1,
      color: {
        dark: '#0A0E0D',
        light: '#FFFFFF'
      }
    });

    // Save individual QR SVG
    const individualQrPath = path.join(QR_OUTPUT_DIR, `${stamp.id}-qr.svg`);
    await fs.writeFile(individualQrPath, qrSvgString, 'utf8');

    // Convert SVG to data URI for embedding directly in self-contained print HTML
    const qrDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(qrSvgString)}`;

    pagesHtml.push(`
      <section class="print-page">
        <header class="print-header">
          <div class="print-brand-row">
            <svg class="print-emblem" viewBox="0 0 100 100" fill="none" stroke="#E5A93C" stroke-width="3.5">
              <path d="${RUNCU_BOUNDARY_PATH}" fill="rgba(229,169,60,0.15)"/>
            </svg>
            <div class="print-brand-text">
              <div class="print-brand-sub">★ PROIECTUL LIDER EUROPEAN 2026 • COMUNA RUNCU, JUD. GORJ ★</div>
              <h1 class="print-brand-main">PAȘAPORTUL RUNCULUI</h1>
            </div>
          </div>
          <div class="print-category-pill" style="--cat-color: ${cat.color};">
            <span>Categoria ${cat.id} • ${cat.labelRo}</span>
          </div>
        </header>

        <main class="print-content">
          <div class="print-title-box">
            <h2 class="print-place-title">${stamp.title}</h2>
            <p class="print-place-desc">${stamp.shortDescription}</p>
          </div>

          <!-- Large High-Scannability QR Area -->
          <div class="print-qr-card">
            <div class="print-qr-frame">
              <img src="${qrDataUri}" alt="Cod QR Ștampilă ${stamp.title}" class="print-qr-image" />
            </div>
            
            <div class="print-code-box">
              <div class="print-code-label">COD MANUAL ALTERNATIV (FĂRĂ CAMERĂ):</div>
              <div class="print-code-value">${stamp.code}</div>
              <div class="print-code-hint">Dacă nu poți scana QR-ul, deschide pașaportul și introdu acest cod.</div>
            </div>
          </div>

          <!-- Instructions Box -->
          <div class="print-instructions-box">
            <h3 class="print-inst-heading">INSTRUCȚIUNI PENTRU VIZITATORI:</h3>
            <ol class="print-inst-list">
              <li><strong>Scanează codul QR</strong> cu camera telefonului pentru a primi ștampila digitală a acestui loc în pașaportul tău.</li>
              <li><strong>Colecționează toate ștampilele</strong> din comună și descarcă <strong>Certificatul Oficial de Explorator al Runcului</strong>!</li>
            </ol>
            <div class="print-privacy-tag">
              ✓ Fără cont • Fără aplicație de descărcat • Datele rămân salvate doar pe telefonul tău
            </div>
          </div>
        </main>

        <footer class="print-footer">
          <div class="print-footer-url">${baseUrl}</div>
          <div class="print-footer-meta">Punctul ${stamp.id} • Coordonate: ${stamp.coordinates[1]} N, ${stamp.coordinates[0]} E</div>
        </footer>
      </section>
    `);
  }

  const completeHtml = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Kit de Tipărire Afișe QR — Pașaportul Runcului</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0A0E0D;
      background: #F0F2F5;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .print-page {
      width: 190mm;
      min-height: 277mm;
      margin: 0 auto 12mm;
      background: #FFFFFF;
      padding: 12mm 14mm 10mm;
      box-shadow: 0 4px 18px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 1px solid #D1D5DB;
      position: relative;
      page-break-after: always;
      break-after: page;
    }

    @media print {
      body {
        background: none;
      }
      .print-page {
        margin: 0;
        box-shadow: none;
        border: none;
        width: 100%;
        min-height: auto;
        height: 100vh;
        padding: 8mm 10mm;
      }
    }

    /* Header */
    .print-header {
      border-bottom: 2px solid #0A0E0D;
      padding-bottom: 5mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .print-brand-row {
      display: flex;
      align-items: center;
      gap: 4mm;
    }

    .print-emblem {
      width: 18mm;
      height: 18mm;
    }

    .print-brand-sub {
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: #1F2937;
      text-transform: uppercase;
    }

    .print-brand-main {
      font-size: 22pt;
      font-weight: 900;
      letter-spacing: 1px;
      color: #0A0E0D;
      font-family: Georgia, serif;
    }

    .print-category-pill {
      border: 1.5px solid var(--cat-color, #10B981);
      background: #F9FAFB;
      color: #0A0E0D;
      padding: 2mm 4mm;
      border-radius: 999px;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      white-space: nowrap;
    }

    /* Main Title Box */
    .print-title-box {
      margin-top: 5mm;
      text-align: center;
    }

    .print-place-title {
      font-size: 20pt;
      font-weight: 800;
      color: #0A0E0D;
      line-height: 1.2;
      font-family: Georgia, serif;
      margin-bottom: 2mm;
    }

    .print-place-desc {
      font-size: 11pt;
      color: #374151;
      max-width: 160mm;
      margin: 0 auto;
      line-height: 1.4;
    }

    /* Large QR Card */
    .print-qr-card {
      margin: 6mm auto;
      text-align: center;
      background: #F9FAFB;
      border: 2px dashed #9CA3AF;
      border-radius: 8mm;
      padding: 6mm 10mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 155mm;
    }

    .print-qr-frame {
      background: #FFFFFF;
      padding: 4mm;
      border-radius: 5mm;
      border: 2px solid #0A0E0D;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .print-qr-image {
      width: 74mm;
      height: 74mm;
      display: block;
    }

    .print-code-box {
      margin-top: 4mm;
    }

    .print-code-label {
      font-size: 8.5pt;
      font-weight: 700;
      color: #4B5563;
      letter-spacing: 0.5px;
    }

    .print-code-value {
      font-family: 'Courier New', Courier, monospace;
      font-size: 24pt;
      font-weight: 900;
      letter-spacing: 4px;
      color: #0A0E0D;
      background: #FFFFFF;
      border: 1.5px solid #0A0E0D;
      display: inline-block;
      padding: 1.5mm 6mm;
      border-radius: 3mm;
      margin: 1.5mm 0;
    }

    .print-code-hint {
      font-size: 8.5pt;
      color: #6B7280;
    }

    /* Instructions Box */
    .print-instructions-box {
      background: #FFFFFF;
      border: 1.5px solid #0A0E0D;
      border-radius: 5mm;
      padding: 4mm 6mm;
      margin: 2mm auto 0;
      max-width: 160mm;
    }

    .print-inst-heading {
      font-size: 9.5pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin-bottom: 2mm;
    }

    .print-inst-list {
      padding-left: 6mm;
      font-size: 10pt;
      color: #1F2937;
      line-height: 1.45;
    }

    .print-privacy-tag {
      margin-top: 3mm;
      font-size: 8.5pt;
      font-weight: 600;
      color: #047857;
      border-top: 1px dotted #D1D5DB;
      padding-top: 2mm;
    }

    /* Footer */
    .print-footer {
      border-top: 1px solid #D1D5DB;
      padding-top: 3mm;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #6B7280;
    }

    .print-footer-url {
      font-family: 'Courier New', Courier, monospace;
      font-weight: 700;
      color: #111827;
    }
  </style>
</head>
<body>
  ${pagesHtml.join('')}
</body>
</html>`;

  const outputPath = path.join(OUTPUT_DIR, 'runcu-kit-tiparire.html');
  await fs.writeFile(outputPath, completeHtml, 'utf8');
  console.log(`[PRINT-KIT] Successfully generated printable A4 file: ${outputPath}`);
  console.log(`[PRINT-KIT] Individual QR codes exported in: ${QR_OUTPUT_DIR}`);
}

runPrintKit().catch(err => {
  console.error('[PRINT-KIT] Error:', err);
  process.exit(1);
});
