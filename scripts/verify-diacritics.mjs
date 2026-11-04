/**
 * Scans and enforces Romanian ISO/IEC 8859-16 comma diacritics
 * (Ș U+0218, ș U+0219, Ț U+021A, ț U+021B)
 * Replacing any legacy cedillas (Ş U+015E, ş U+015F, Ţ U+0162, ţ U+0163).
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const TARGET_DIRS = ['src', 'public/data'];

async function scanAndFixDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await scanAndFixDir(fullPath);
    } else if (/\.(js|json|html|css)$/.test(entry.name)) {
      let content = await fs.readFile(fullPath, 'utf8');
      const original = content;

      // Replace cedilla with standard comma-below
      content = content
        .replace(/\u015E/g, '\u0218') // Ş -> Ș
        .replace(/\u015F/g, '\u0219') // ş -> ș
        .replace(/\u0162/g, '\u021A') // Ţ -> Ț
        .replace(/\u0163/g, '\u021B'); // ţ -> ț

      if (content !== original) {
        await fs.writeFile(fullPath, content, 'utf8');
        console.log(`[DIACRITICS] Fixed comma diacritics in: ${fullPath}`);
      }
    }
  }
}

async function run() {
  for (const dir of TARGET_DIRS) {
    await scanAndFixDir(path.resolve(dir));
  }
  console.log('[DIACRITICS] Diacritics audit completed.');
}

run().catch(console.error);
