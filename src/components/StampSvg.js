/**
 * Dynamic Authentic Stamp Generator with Ink Texture & Single-Pass Bitmap Caching
 * Heavy SVG filters (feTurbulence) are rasterized ONCE into a lightweight bitmap cache,
 * eliminating runtime GPU filter passes during 60fps scrolling and page turns.
 */

import { CATEGORY_META } from '../tokens.js';

// Global memory cache for pre-rendered stamp bitmaps (data URLs)
const stampBitmapCache = new Map();

export function getStampAngle(id) {
  if (!id) return -2;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 37 + id.charCodeAt(i)) & 0xffffffff;
  }
  const angle = (Math.abs(hash) % 15) - 7;
  return angle === 0 ? 3.5 : angle;
}

/**
 * Returns raw SVG markup for a stamp
 */
export function generateRawStampSvg(stamp, unlockInfo = null, { size = 180 } = {}) {
  const catMeta = CATEGORY_META[stamp.category] || CATEGORY_META.A;
  const color = catMeta.color;
  const angle = getStampAngle(stamp.id);
  const unlockDate = unlockInfo?.dateFormatted || 'RUNCU 2026';
  const filterId = `ink-bleed-${stamp.id}`;
  const pathTopId = `text-path-top-${stamp.id}`;
  const pathBottomId = `text-path-bottom-${stamp.id}`;

  let titleForArc = (stamp.title || 'COMUNA RUNCU').toUpperCase();
  if (titleForArc.length > 28) {
    titleForArc = titleForArc.slice(0, 26) + '...';
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" class="stamp-svg-raw" viewBox="0 0 200 200" width="${size}" height="${size}" aria-label="Ștampila ${stamp.title}">
      <defs>
        <!-- Ink Texture Displacement Filter -->
        <filter id="${filterId}" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <path id="${pathTopId}" d="M 28 100 A 72 72 0 1 1 172 100" fill="none" />
        <path id="${pathBottomId}" d="M 172 100 A 72 72 0 0 1 28 100" fill="none" />
      </defs>

      <g class="stamp-rotator" transform="rotate(${angle} 100 100)" filter="url(#${filterId})">
        <!-- Outer jagged/weathered seal ring -->
        <circle cx="100" cy="100" r="92" fill="none" stroke="${color}" stroke-width="3.2" stroke-dasharray="9 3" opacity="0.92" />
        <!-- Inner double ring -->
        <circle cx="100" cy="100" r="84" fill="none" stroke="${color}" stroke-width="1.8" opacity="0.88" />
        <circle cx="100" cy="100" r="58" fill="none" stroke="${color}" stroke-width="1.2" stroke-dasharray="4 2" opacity="0.75" />

        <!-- Circular curved typography (Romanian diacritics supported) -->
        <text class="stamp-text" fill="${color}" font-size="10" font-family="'JetBrains Mono', monospace" font-weight="700" letter-spacing="2">
          <textPath href="#${pathTopId}" startOffset="50%" text-anchor="middle">
            ${titleForArc}
          </textPath>
        </text>

        <text class="stamp-text" fill="${color}" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="700" letter-spacing="2.5">
          <textPath href="#${pathBottomId}" startOffset="50%" text-anchor="middle">
            ★ COMUNA RUNCU • GORJ ★
          </textPath>
        </text>

        <!-- Center Insignia Icon -->
        <g transform="translate(82, 68) scale(1.5)" class="stamp-center-icon" stroke="${color}" fill="none">
          ${catMeta.iconSvg}
        </g>

        <!-- Verification Date Box -->
        <rect x="52" y="112" width="96" height="20" rx="4" fill="${color}" fill-opacity="0.16" stroke="${color}" stroke-width="1.2" />
        <text x="100" y="126" text-anchor="middle" fill="${color}" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" letter-spacing="1.2">
          ${unlockDate}
        </text>

        ${unlockInfo?.verified ? `
          <circle cx="100" cy="144" r="5" fill="${color}" opacity="0.9"/>
          <text x="100" y="147" text-anchor="middle" fill="#FAF6ED" font-size="7" font-weight="bold">✓</text>
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Pre-renders an SVG stamp to a raster PNG data URL once
 */
export async function rasterizeStampToBitmap(stamp, unlockInfo, size = 200) {
  const cacheKey = `${stamp.id}-${unlockInfo?.dateFormatted || 'def'}-${size}`;
  if (stampBitmapCache.has(cacheKey)) {
    return stampBitmapCache.get(cacheKey);
  }

  return new Promise((resolve) => {
    const rawSvg = generateRawStampSvg(stamp, unlockInfo, { size });
    const blob = new Blob([rawSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/png');
      stampBitmapCache.set(cacheKey, dataUrl);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Generates the HTML for a stamp badge, leveraging the cached bitmap when available
 */
export function generateStampSvg(stamp, unlockInfo = null, { size = 160 } = {}) {
  const catMeta = CATEGORY_META[stamp.category] || CATEGORY_META.A;
  const color = catMeta.color;
  const angle = getStampAngle(stamp.id);
  const cacheKey = `${stamp.id}-${unlockInfo?.dateFormatted || 'def'}-${size}`;
  const cachedBitmap = stampBitmapCache.get(cacheKey);

  if (cachedBitmap) {
    return `
      <div class="stamp-badge-wrap is-unlocked is-bitmap-cached" 
           style="--stamp-color: ${color}; width: ${size}px; height: ${size}px;"
           data-stamp-id="${stamp.id}">
        <img src="${cachedBitmap}" width="${size}" height="${size}" alt="Ștampila ${stamp.title}" class="stamp-cached-img" />
      </div>
    `;
  }

  // Pre-rasterize in the background for subsequent renders
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      rasterizeStampToBitmap(stamp, unlockInfo, size);
    });
  }

  return `
    <div class="stamp-badge-wrap ${unlockInfo ? 'is-unlocked' : 'is-locked'}" 
         style="--stamp-color: ${color}; --stamp-angle: ${angle}deg; width: ${size}px; height: ${size}px;"
         data-stamp-id="${stamp.id}">
      ${generateRawStampSvg(stamp, unlockInfo, { size })}
    </div>
  `;
}

/**
 * Locked Stamp Slot with tactile dashed outline and Category Seal watermark
 */
export function generateLockedSlotSvg(stamp, { size = 160 } = {}) {
  const catMeta = CATEGORY_META[stamp.category] || CATEGORY_META.A;
  return `
    <div class="stamp-badge-wrap is-locked" style="width: ${size}px; height: ${size}px;" data-stamp-id="${stamp.id}">
      <svg class="stamp-svg" viewBox="0 0 200 200" width="${size}" height="${size}" aria-label="Loc nedeblocat">
        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(23,33,29,0.22)" stroke-width="1.8" stroke-dasharray="6 6" class="slot-border" />
        <circle cx="100" cy="100" r="58" fill="rgba(23,33,29,0.02)" stroke="rgba(23,33,29,0.14)" stroke-width="1" stroke-dasharray="3 3" />
        <text x="100" y="94" text-anchor="middle" font-family="'Cormorant Garamond', Georgia, serif" font-size="44" font-weight="600" fill="rgba(23,33,29,0.3)">?</text>
        <text x="100" y="124" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" font-weight="700" fill="rgba(23,33,29,0.5)" letter-spacing="0.5">
          ${catMeta.labelRo}
        </text>
      </svg>
    </div>
  `;
}
