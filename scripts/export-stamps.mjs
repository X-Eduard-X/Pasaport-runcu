import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const MAP_DIR = path.resolve('C:/Users/Edy/Downloads/mapa');
const WAYPOINTS_PATH = path.join(MAP_DIR, 'data', 'waypoints.json');
const STAMPS_OUTPUT_PATH = path.resolve('public/data/stamps.json');
const PHOTOS_OUTPUT_DIR = path.resolve('public/photos');

// Safe charset for human-readable codes (no 0/O, 1/I)
const CODE_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateShortCode(length = 6) {
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += CODE_CHARSET[bytes[i] % CODE_CHARSET.length];
  }
  return result;
}

function generateLongToken() {
  return crypto.randomBytes(16).toString('hex');
}

// 4 confirmed points to include in digital passport
const SELECTED_IDS = [
  'a-chei-rau',
  'b-port-popular-ansamblu',
  'c-personalitate-locala',
  'd-rachiti-troite-lemn'
];

// Factual concise short descriptions derived strictly from verified waypoints.json
const SHORT_DESCRIPTIONS = {
  'a-chei-rau': 'Defileu carstic spectaculos săpat de râul Sohodol în Munții Vâlcan, cu pereți verticali și forme naturale unice.',
  'b-port-popular-ansamblu': 'Costum popular gorjenesc autentic, cămăși cusute cu altiță și tradiții comunitare transmise tinerilor din Runcu.',
  'c-personalitate-locala': '„Privighetoarea Gorjului” (1954–1993), voce de aur a folclorului românesc, născută și cinstită în Runcu.',
  'd-rachiti-troite-lemn': 'Poarta de intrare în comună și troițele sculptate în lemn cu motive solare străvechi la răscrucile satului Răchiți.'
};

const DEFAULT_RADII = {
  'a-chei-rau': 350,
  'b-port-popular-ansamblu': 200,
  'c-personalitate-locala': 200,
  'd-rachiti-troite-lemn': 200
};

async function exportStamps() {
  console.log('[EXPORT-STAMPS] Reading waypoints from:', WAYPOINTS_PATH);
  const rawWaypoints = await fs.readFile(WAYPOINTS_PATH, 'utf8');
  const mapaData = JSON.parse(rawWaypoints);

  await fs.mkdir(path.dirname(STAMPS_OUTPUT_PATH), { recursive: true });
  await fs.mkdir(PHOTOS_OUTPUT_DIR, { recursive: true });

  // Load existing stamps if available to preserve tokens & codes
  let existingStamps = [];
  try {
    const existingRaw = await fs.readFile(STAMPS_OUTPUT_PATH, 'utf8');
    const existingJson = JSON.parse(existingRaw);
    existingStamps = Array.isArray(existingJson) ? existingJson : existingJson.stamps || [];
    console.log(`[EXPORT-STAMPS] Found ${existingStamps.length} existing stamps. Preserving tokens and codes.`);
  } catch {
    console.log('[EXPORT-STAMPS] No existing stamps.json found. Generating fresh tokens and codes.');
  }

  const existingMap = new Map(existingStamps.map(s => [s.id, s]));

  const outputStamps = [];

  for (const id of SELECTED_IDS) {
    const wp = mapaData.waypoints.find(w => w.id === id);
    if (!wp) {
      console.warn(`[EXPORT-STAMPS] Warning: Waypoint "${id}" not found in waypoints.json!`);
      continue;
    }

    const prev = existingMap.get(id);
    const token = prev?.token || generateLongToken();
    const code = prev?.code || generateShortCode(6);
    const radius = prev?.radius || DEFAULT_RADII[id] || 200;
    const shortDescription = SHORT_DESCRIPTIONS[id] || wp.subtitle || wp.description.slice(0, 140) + '...';

    // Optimize and copy photo (WebP, ~800px width)
    let photoRelPath = `photos/${id}.webp`;
    const photoCandidate = wp.photos?.[0];
    if (photoCandidate) {
      // Find source image in mapa assets
      let srcPath = path.join(MAP_DIR, photoCandidate.src);
      try {
        await fs.access(srcPath);
      } catch {
        // Fallback to fallback jpg if webp doesn't exist directly
        if (photoCandidate.fallback) {
          srcPath = path.join(MAP_DIR, photoCandidate.fallback);
        }
      }

      const outPhotoFile = path.join(PHOTOS_OUTPUT_DIR, `${id}.webp`);
      try {
        await sharp(srcPath)
          .resize({ width: 800, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(outPhotoFile);
        console.log(`[EXPORT-STAMPS] Photo generated: ${outPhotoFile}`);
      } catch (err) {
        console.error(`[EXPORT-STAMPS] Error optimizing photo for ${id}:`, err.message);
      }
    }

    outputStamps.push({
      id: wp.id,
      category: wp.category,
      title: wp.title,
      shortDescription,
      coordinates: wp.coordinates,
      photo: photoRelPath,
      token,
      code,
      radius
    });
  }

  const finalPayload = {
    updatedAt: new Date().toISOString(),
    total: outputStamps.length,
    stamps: outputStamps
  };

  await fs.writeFile(STAMPS_OUTPUT_PATH, JSON.stringify(finalPayload, null, 2), 'utf8');
  console.log(`[EXPORT-STAMPS] Successfully exported ${outputStamps.length} stamps to ${STAMPS_OUTPUT_PATH}`);
}

exportStamps().catch(err => {
  console.error('[EXPORT-STAMPS] Fatal error:', err);
  process.exit(1);
});
