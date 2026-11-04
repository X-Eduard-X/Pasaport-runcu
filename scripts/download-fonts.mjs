/**
 * Downloads self-hosted WOFF2 fonts for Latin & Latin-Extended (Romanian diacritics)
 * Saves to public/fonts/ and generates src/styles/fonts.css
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const FONTS_DIR = path.resolve('public/fonts');
const CSS_OUT = path.resolve('src/styles/fonts.css');

const FONT_REQUEST_URL =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;600;700&family=JetBrains+Mono:wght@600&display=swap';

async function run() {
  await fs.mkdir(FONTS_DIR, { recursive: true });

  console.log('[FONTS] Requesting Google Fonts CSS...');
  const res = await fetch(FONT_REQUEST_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const css = await res.text();

  // Parse font-face blocks
  const blocks = css.split('@font-face {');
  const localCssBlocks = [];

  let count = 0;
  for (const rawBlock of blocks) {
    if (!rawBlock.includes('src: url(')) continue;

    // Filter for latin and latin-ext
    const isLatinExt = rawBlock.includes('/* latin-ext */');
    const isLatin = rawBlock.includes('/* latin */');
    if (!isLatin && !isLatinExt) continue;

    const familyMatch = rawBlock.match(/font-family:\s*'([^']+)'/);
    const weightMatch = rawBlock.match(/font-weight:\s*(\d+)/);
    const urlMatch = rawBlock.match(/src:\s*url\((https:[^)]+\.woff2)\)/);
    const unicodeMatch = rawBlock.match(/unicode-range:\s*([^;]+);/);

    if (!familyMatch || !weightMatch || !urlMatch) continue;

    const family = familyMatch[1];
    const weight = weightMatch[1];
    const remoteUrl = urlMatch[1];
    const unicode = unicodeMatch ? unicodeMatch[1] : '';

    const safeName = `${family.toLowerCase().replace(/\s+/g, '-')}-${weight}-${isLatinExt ? 'latinext' : 'latin'}.woff2`;
    const localFile = path.join(FONTS_DIR, safeName);

    console.log(`[FONTS] Downloading ${safeName}...`);
    const fontRes = await fetch(remoteUrl);
    const fontBuffer = Buffer.from(await fontRes.arrayBuffer());
    await fs.writeFile(localFile, fontBuffer);
    count++;

    localCssBlocks.push(`
@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url('/fonts/${safeName}') format('woff2');
  unicode-range: ${unicode};
}`);
  }

  await fs.writeFile(CSS_OUT, localCssBlocks.join('\n\n'), 'utf8');
  console.log(`[FONTS] Successfully downloaded ${count} WOFF2 files and generated ${CSS_OUT}`);
}

run().catch(console.error);
