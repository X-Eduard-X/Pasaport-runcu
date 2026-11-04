import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { RUNCU_BOUNDARY_PATH } from '../src/data/boundary.js';

const ICONS_DIR = path.resolve('public/icons');

async function generateIcons() {
  await fs.mkdir(ICONS_DIR, { recursive: true });

  // Standard Icon (192 and 512)
  const createSvg = (size, isMaskable = false) => {
    const pad = isMaskable ? size * 0.18 : size * 0.08;
    const emblemSize = size - pad * 2;
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#0A0E0D" />
        <circle cx="${size/2}" cy="${size/2}" r="${size * 0.44}" fill="none" stroke="#E5A93C" stroke-width="${size * 0.02}" />
        <circle cx="${size/2}" cy="${size/2}" r="${size * 0.40}" fill="#111816" stroke="rgba(229,169,60,0.4)" stroke-width="${size * 0.01}" />
        
        <g transform="translate(${pad}, ${pad}) scale(${emblemSize / 100})">
          <path d="${RUNCU_BOUNDARY_PATH}" fill="rgba(229,169,60,0.3)" stroke="#E5A93C" stroke-width="2.5" />
        </g>

        <text x="${size/2}" y="${size * 0.88}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="${size * 0.07}" font-weight="700" fill="#F5C45E" letter-spacing="2">
          RUNCU
        </text>
      </svg>
    `;
  };

  const svg192 = Buffer.from(createSvg(192, false));
  const svg512 = Buffer.from(createSvg(512, false));
  const svgMaskable = Buffer.from(createSvg(512, true));

  await sharp(svg192).png().toFile(path.join(ICONS_DIR, 'icon-192.png'));
  await sharp(svg512).png().toFile(path.join(ICONS_DIR, 'icon-512.png'));
  await sharp(svgMaskable).png().toFile(path.join(ICONS_DIR, 'icon-maskable-512.png'));

  console.log('[ICONS] Generated icon-192.png, icon-512.png, icon-maskable-512.png');
}

generateIcons().catch(console.error);
