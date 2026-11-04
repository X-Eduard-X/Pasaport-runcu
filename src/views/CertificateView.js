/**
 * Certificate View — "Explorator al Runcului"
 * High-resolution canvas generator, PNG export & Web Share API integration.
 */

import { APP_CONFIG } from '../config.js';
import { getUserName, getPassportData } from '../services/storage.js';
import { icon } from '../components/icons.js';

export function renderCertificateView(stampsData, container) {
  const passport = getPassportData();
  const userName = getUserName() || 'Călător al Gorjului';
  const unlockedCount = Object.keys(passport.unlocked || {}).length;
  const totalCount = stampsData.length;

  const now = new Date();
  const certDate = now.toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const certSeries = `RC-${(now.getFullYear()).toString()}-${Math.abs(hashString(passport.createdAt || 'cert')).toString().slice(0, 6)}`;

  container.innerHTML = `
    <!-- Header -->
    <header class="app-header">
      <div class="app-brand">
        <img src="./assets/logos/stema-comuna-runcu.png" alt="Stema Comunei Runcu" class="brand-crest-stema" width="28" height="44" />
        <a href="#/pasaport" style="display: flex; align-items: center; gap: 0.5rem;" title="Înapoi la pașaport" aria-label="Înapoi la pașaport">
          ${icon('back', 20)}
          <span class="brand-title">Certificat</span>
        </a>
      </div>
      <div class="header-actions">
        <span class="passport-pill-counter" aria-label="Expediție completă 100%">100% Complet</span>
      </div>
    </header>

    <main class="passport-view" style="align-items: center; text-align: center;">
      <!-- Institutional Credentials Strip -->
      <div class="cert-partner-strip" aria-label="Acreditare parteneri oficiali">
        <div class="cert-partner-pill">
          <img src="./assets/logos/stema-comuna-runcu.png" alt="Comuna Runcu" class="cert-partner-img shield" />
          <span>Comuna Runcu</span>
        </div>
        <div class="cert-partner-pill">
          <img src="./assets/logos/logo-liceu-runcu.jpg" alt="Liceul Tehnologic" class="cert-partner-img round" />
          <span>Liceul Tehnologic „G-ral C-tin Șandru”</span>
        </div>
        <div class="cert-partner-pill">
          <img src="./assets/logos/logo-lider-european.jpg" alt="Lider European" class="cert-partner-img rect" />
          <span>Lider European 2026</span>
        </div>
      </div>

      <!-- Canvas Display Wrapper -->
      <div style="width: 100%; max-width: 480px; position: relative; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-modal); border: 2px solid var(--accent-brand);">
        <canvas id="cert-canvas" width="1600" height="1130" style="width: 100%; height: auto; display: block;" aria-label="Certificat de Explorator al Runcului"></canvas>
      </div>

      <!-- Action Buttons -->
      <div class="unlock-actions-row" style="margin-top: 1.25rem;">
        <button type="button" class="btn-primary-action" id="btn-download-cert" aria-label="Descarcă certificatul în format PNG">
          ${icon('download', 18)}
          <span>Salvează Certificatul (PNG)</span>
        </button>

        <button type="button" class="btn-secondary-action" id="btn-share-cert" aria-label="Distribuie certificatul">
          ${icon('share', 18)}
          <span>Distribuie Realizarea</span>
        </button>
      </div>

      ${APP_CONFIG.reward?.enabled && APP_CONFIG.reward?.text ? `
        <div style="margin-top: 1.5rem; background: var(--bg-panel); border: 1px solid var(--accent-brand); border-radius: var(--radius-md); padding: 1rem; width: 100%; max-width: 440px;">
          <div style="font-size: 0.76rem; font-weight: 700; color: var(--accent-brand); text-transform: uppercase;">Recompensă partener</div>
          <p style="font-size: 0.9rem; color: var(--text-primary); margin-top: 0.25rem;">${APP_CONFIG.reward.text}</p>
        </div>
      ` : ''}

      <div style="margin-top: 1.5rem;">
        <a href="#/pasaport" style="font-size: 0.85rem; color: var(--text-secondary); text-decoration: underline;">
          Înapoi la pașaport
        </a>
      </div>
    </main>
  `;

  // Draw Certificate onto Canvas
  const canvas = container.querySelector('#cert-canvas');
  if (canvas) {
    drawCertificateToCanvas(canvas, {
      userName,
      certDate,
      certSeries,
      totalCount
    });
  }

  // Handle Download
  const downloadBtn = container.querySelector('#btn-download-cert');
  if (downloadBtn && canvas) {
    downloadBtn.addEventListener('click', () => {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Certificat-Explorator-Runcu-${userName.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  // Handle Share
  const shareBtn = container.querySelector('#btn-share-cert');
  if (shareBtn && canvas) {
    shareBtn.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          canvas.toBlob(async (blob) => {
            if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'certificat.png', { type: 'image/png' })] })) {
              const file = new File([blob], 'Certificat-Explorator-Runcu.png', { type: 'image/png' });
              await navigator.share({
                title: 'Certificat de Explorator al Runcului',
                text: 'Am completat Pașaportul Runcului — Proiectul Lider European 2026!',
                files: [file]
              });
            } else {
              await navigator.share({
                title: 'Certificat de Explorator al Runcului',
                text: 'Am completat toate cele 12 ștampile în Pașaportul Runcului!',
                url: window.location.href
              });
            }
          }, 'image/png');
        } catch {
          // Share was cancelled or failed
        }
      } else {
        alert('Partajarea directă nu este suportată pe acest browser. Folosește butonul „Salvează Certificatul”.');
      }
    });
  }
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  return hash;
}

async function drawCertificateToCanvas(canvas, { userName, certDate, certSeries, totalCount }) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Background — Obsidian Carpathian Gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0E1714');
  grad.addColorStop(0.5, '#090E0D');
  grad.addColorStop(1, '#081210');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Decorative Border
  ctx.strokeStyle = '#D8A24A';
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, w - 80, h - 80);

  ctx.strokeStyle = 'rgba(216, 162, 74, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(52, 52, w - 104, h - 104);

  // Corner Ornaments
  const corners = [
    [52, 52],
    [w - 52, 52],
    [52, h - 52],
    [w - 52, h - 52]
  ];
  ctx.fillStyle = '#D8A24A';
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Load the 3 official logos
  const loadImage = (src) => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  const [imgStema, imgLiceu, imgLider] = await Promise.all([
    loadImage('./assets/logos/stema-comuna-runcu.png'),
    loadImage('./assets/logos/logo-liceu-runcu.jpg'),
    loadImage('./assets/logos/logo-lider-european.jpg')
  ]);

  // 1. Draw Stema Comunei Runcu (Top Left)
  if (imgStema) {
    const stemaW = 84;
    const stemaH = Math.round(stemaW * (286 / 180)); // 133px
    const stemaX = 90;
    const stemaY = 75;
    ctx.drawImage(imgStema, stemaX, stemaY, stemaW, stemaH);

    ctx.fillStyle = '#D8A24A';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('COMUNA RUNCU', stemaX + stemaW / 2, stemaY + stemaH + 18);
  }

  // 2. Draw Liceul Tehnologic G-ral C-tin Șandru Seal (Top Right)
  if (imgLiceu) {
    const liceuSize = 118;
    const liceuX = w - 90 - liceuSize;
    const liceuY = 82;
    const cx = liceuX + liceuSize / 2;
    const cy = liceuY + liceuSize / 2;
    const r = liceuSize / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(imgLiceu, liceuX, liceuY, liceuSize, liceuSize);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#D8A24A';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#D8A24A';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LICEUL TEHNOLOGIC', cx, liceuY + liceuSize + 18);
  }

  // 3. Draw Lider European Logo (Bottom Right)
  if (imgLider) {
    const liderW = 82;
    const liderH = Math.round(liderW * (501 / 399)); // 103px
    const liderX = w - 320;
    const liderY = 825;

    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(liderX, liderY, liderW, liderH, 8);
    } else {
      ctx.rect(liderX, liderY, liderW, liderH);
    }
    ctx.clip();
    ctx.drawImage(imgLider, liderX, liderY, liderW, liderH);
    ctx.restore();

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(liderX, liderY, liderW, liderH, 8);
    } else {
      ctx.rect(liderX, liderY, liderW, liderH);
    }
    ctx.strokeStyle = '#D8A24A';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#93C5FD';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LIDER EUROPEAN', liderX + liderW / 2, liderY + liderH + 16);
  }

  // Top Lead Badge
  ctx.fillStyle = '#93C5FD';
  ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PROIECTUL LIDER EUROPEAN 2026 • COMUNA RUNCU, JUD. GORJ', w / 2, 130);

  // Main Certificate Title
  ctx.fillStyle = '#F5F3EE';
  ctx.font = '700 74px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('CERTIFICAT DE EXPLORATOR', w / 2, 230);

  // Subtitle
  ctx.fillStyle = '#F5D37E';
  ctx.font = '600 28px "JetBrains Mono", monospace';
  ctx.letterSpacing = '3px';
  ctx.fillText('AL PATRIMONIULUI COMUNEI RUNCU', w / 2, 285);

  // Awarded to
  ctx.fillStyle = '#C5C0B4';
  ctx.font = '400 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Se conferă cu mândrie exploratorului:', w / 2, 385);

  // User Name
  ctx.fillStyle = '#FFE082';
  ctx.font = '700 58px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(userName, w / 2, 470);

  // Decorative underline
  ctx.strokeStyle = '#D8A24A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 250, 495);
  ctx.lineTo(w / 2 + 250, 495);
  ctx.stroke();

  // Achievement text
  ctx.fillStyle = '#F5F3EE';
  ctx.font = '400 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Pentru parcurgerea pe teren și colecționarea tuturor celor ${totalCount} ștampile`, w / 2, 575);
  ctx.fillText('reprezentative ale naturii, tradițiilor, memoriei și personalităților din Runcu.', w / 2, 620);

  // Category symbols row
  ctx.font = '500 22px "JetBrains Mono", monospace';
  ctx.fillStyle = '#198764';
  ctx.fillText('Obiective Turistice', w / 2 - 360, 720);
  ctx.fillStyle = '#BF572B';
  ctx.fillText('Tradiții & Obiceiuri', w / 2 - 120, 720);
  ctx.fillStyle = '#C28B1E';
  ctx.fillText('Personalități Locale', w / 2 + 130, 720);
  ctx.fillStyle = '#744E94';
  ctx.fillText('Poveștile Comunității', w / 2 + 370, 720);

  // Gold Seal / Emblem Stamp Circle in center bottom
  ctx.beginPath();
  ctx.arc(w / 2, 875, 75, 0, Math.PI * 2);
  ctx.strokeStyle = '#D8A24A';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(w / 2, 875, 68, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(216, 162, 74, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#D8A24A';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillText('COMUNA RUNCU', w / 2, 855);
  ctx.fillText('GORJ • ROMÂNIA', w / 2, 880);
  ctx.font = '600 15px "JetBrains Mono", monospace';
  ctx.fillStyle = '#93C5FD';
  ctx.fillText('LIDER 2026', w / 2, 905);

  // Bottom Left: Date
  ctx.textAlign = 'left';
  ctx.fillStyle = '#C5C0B4';
  ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Data eliberării: ${certDate}`, 90, 1030);

  // Bottom Right: Series ID
  ctx.textAlign = 'right';
  ctx.fillStyle = '#C5C0B4';
  ctx.font = '600 20px "JetBrains Mono", monospace';
  ctx.fillText(`Seria: ${certSeries}`, w - 90, 1030);
}
