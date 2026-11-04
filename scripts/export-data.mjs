/**
 * Data export: builds public/data/stamps.json and public/data/stories.json
 * from the map project's waypoints.json (read-only source).
 *
 * - Preserves existing tokens/codes so printed QR codes never break.
 * - Images: AVIF + WebP at 480/840 px, EXIF stripped (sharp default), fixed
 *   width/height and dominant colour for zero-CLS placeholders.
 * - Content rule: every "didYouKnow" and quiz below is grounded in the text or
 *   photo captions of waypoints.json. Anything not sourced is left null and
 *   flagged with needsReview so the team can supply it ("[TEXT AICI]").
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const MAP_DIR = path.resolve('C:/Users/Edy/Downloads/mapa');
const WAYPOINTS_PATH = path.join(MAP_DIR, 'data', 'waypoints.json');
const STAMPS_OUTPUT_PATH = path.resolve('public/data/stamps.json');
const STORIES_OUTPUT_PATH = path.resolve('public/data/stories.json');
const PHOTOS_OUTPUT_DIR = path.resolve('public/photos');
const WIDTHS = [480, 840];

const CODE_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateShortCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += CODE_CHARSET[bytes[i] % CODE_CHARSET.length];
  return out;
}

const generateLongToken = () => crypto.randomBytes(16).toString('hex');

// Grounded in waypoints.json description/captions (see comment per entry).
const DID_YOU_KNOW = {
  // description: "Peștera Popii, vestită pentru desenele sale rupestre preistorice"
  'a-chei-rau': 'În Cheile Sohodolului se află Peștera Popii, vestită pentru desenele sale rupestre preistorice.',
  // description: "La 10 iunie 2005 ... «Drumul Crucii» ... cruce metalică dedicată memoriei eroilor"
  'a-varful-arcanu': 'Crucea de pe Vârful Arcanu a fost înălțată la 10 iunie 2005, în cadrul inițiativei „Drumul Crucii”, în memoria eroilor.',
  // description: "drumul județean DJ672C ... cale de acces rutier și cicloturistic către Munții Vâlcan"
  'a-drum-priveliste': 'Drumul județean DJ672C este una dintre căile de acces rutier și cicloturistic către Munții Vâlcan.',
  // description: "cărări ... bătătorite ... de ciobanii aflați în transhumanță"
  'a-poteca-padure': 'Potecile din făgetele Vâlcanului au fost bătătorite de-a lungul secolelor și de ciobanii aflați în transhumanță.',
  // description: "Biserica «Sfânta Cuvioasă Parascheva» din Runcu (ridicată la cumpăna secolelor XIX–XX)"
  'a-interior-candelabru': 'Biserica „Sfânta Cuvioasă Parascheva” din Runcu a fost ridicată la cumpăna secolelor XIX–XX.',
  // description: "șuba lungă din dimie albă sau neagră, împodobită cu găitane"
  'b-port-popular-ansamblu': 'Șuba lungă din dimie albă sau neagră, împodobită cu găitane, este o piesă aparte a zestrei pastorale.',
  // description: "hora duminicală și nedeile sătești au reprezentat inima vieții sociale"
  'b-dans-hora': 'Hora duminicală și nedeile sătești au fost, din generație în generație, inima vieții sociale în satele comunei.',
  // description: "Din firele toarse manual ... au luat naștere scoarțele oltenești"
  'b-mesteguri-torsul-lanii': 'Din firele toarse manual și vopsite în culori calde au luat naștere scoarțele oltenești.',
  // description: "afumate domol cu lemn de fag: cârnații de casă, slănina și caltaboșul"
  'b-gastronomie-locala': 'Preparatele din carne ale gospodăriilor sunt afumate domol cu lemn de fag.',
  // description: "Laureată cu nota 10 la ... «Floarea din grădină» (1973)"
  'c-personalitate-locala': 'Maria Apostol a fost laureată cu nota 10 la trofeul TVR „Floarea din grădină”, în 1973.',
  // description: "troițe din lemn crestat cu motive solare și funie răsucită, ... acoperișuri de șindrilă"
  'd-rachiti-troite-lemn': 'Troițele de la Răchiți sunt crestate cu motive solare și funie răsucită și stau sub acoperișuri de șindrilă.',
  // description: "întoarcerea de la coasă cu carul tras de boi"
  'd-poveste-comunitate': 'Fotografiile de arhivă păstrate în familii surprind și întoarcerea de la coasă cu carul tras de boi.'
};

// Quizzes for B/C/D. Correct answer is stated in the source text (comment).
// Wrong options are generic distractors, not claims about Runcu.
const QUIZZES = {
  // "șuba lungă din dimie ... împodobită cu găitane"
  'b-port-popular-ansamblu': {
    question: 'Cu ce este împodobită șuba lungă din dimie a zestrei pastorale?',
    options: ['Cu găitane', 'Cu paiete', 'Cu nasturi de sidef'],
    answerIndex: 0
  },
  // "hora duminicală și nedeile sătești"
  'b-dans-hora': {
    question: 'Ce au reprezentat hora duminicală și nedeile sătești pentru satele comunei?',
    options: ['Inima vieții sociale', 'Un obicei apărut recent', 'Un concurs sportiv'],
    answerIndex: 0
  },
  // caption: "Torsul lânii cu furca și fusul"
  'b-mesteguri-torsul-lanii': {
    question: 'Cu ce unelte se toarce lâna pe prispa casei?',
    options: ['Cu furca și fusul', 'Cu războiul mecanic', 'Cu mașina de cusut'],
    answerIndex: 0
  },
  // "afumate domol cu lemn de fag"
  'b-gastronomie-locala': {
    question: 'Cu ce lemn sunt afumate preparatele din carne ale gospodăriilor?',
    options: ['Cu lemn de fag', 'Cu lemn de brad', 'Cu lemn de salcâm'],
    answerIndex: 0
  },
  // "supranumită «Privighetoarea Gorjului»"
  'c-personalitate-locala': {
    question: 'Cum a fost supranumită Maria Apostol?',
    options: ['„Privighetoarea Gorjului”', '„Ciocârlia Moldovei”', '„Glasul Banatului”'],
    answerIndex: 0
  },
  // "motive solare și funie răsucită"
  'd-rachiti-troite-lemn': {
    question: 'Ce motive sunt crestate pe troițele de la Răchiți?',
    options: ['Motive solare și funie răsucită', 'Motive marine', 'Litere latine'],
    answerIndex: 0
  },
  // "întoarcerea de la coasă cu carul tras de boi"
  'd-poveste-comunitate': {
    question: 'Cu ce se întorceau sătenii de la coasă, în fotografiile de arhivă?',
    options: ['Cu carul tras de boi', 'Cu trăsura', 'Cu tractorul'],
    answerIndex: 0
  }
};

async function resolveSource(srcRelPath) {
  const candidates = [srcRelPath, srcRelPath.replace(/\.webp$/, '.jpg')];
  for (const rel of candidates) {
    const abs = path.join(MAP_DIR, rel);
    try {
      await fs.access(abs);
      return abs;
    } catch {
      // try next
    }
  }
  return null;
}

/**
 * Produces AVIF+WebP variants and returns photo metadata.
 */
async function optimizeImage(srcRelPath, baseName) {
  const srcPath = await resolveSource(srcRelPath);
  if (!srcPath) {
    console.warn(`[EXPORT] Missing source image: ${srcRelPath}`);
    return null;
  }

  const meta = await sharp(srcPath).metadata();
  const ratio = meta.height / meta.width;
  const { dominant } = await sharp(srcPath).stats();
  const color = `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`;

  const webp = [];
  const avif = [];
  for (const w of WIDTHS) {
    const targetW = Math.min(w, meta.width);
    const webpName = `${baseName}-${w}.webp`;
    const avifName = `${baseName}-${w}.avif`;
    // sharp strips EXIF/XMP/IPTC by default (no .withMetadata()).
    await sharp(srcPath).resize({ width: targetW }).webp({ quality: 78 }).toFile(path.join(PHOTOS_OUTPUT_DIR, webpName));
    await sharp(srcPath).resize({ width: targetW }).avif({ quality: 52, effort: 4 }).toFile(path.join(PHOTOS_OUTPUT_DIR, avifName));
    webp.push(`photos/${webpName} ${targetW}w`);
    avif.push(`photos/${avifName} ${targetW}w`);
  }

  const w = Math.min(840, meta.width);
  return {
    src: `photos/${baseName}-840.webp`,
    srcsetWebp: webp.join(', '),
    srcsetAvif: avif.join(', '),
    width: w,
    height: Math.round(w * ratio),
    color
  };
}

async function cleanPhotosDir() {
  await fs.mkdir(PHOTOS_OUTPUT_DIR, { recursive: true });
  for (const f of await fs.readdir(PHOTOS_OUTPUT_DIR)) {
    await fs.unlink(path.join(PHOTOS_OUTPUT_DIR, f));
  }
}

async function runExport() {
  console.log('[EXPORT] Reading waypoints from:', WAYPOINTS_PATH);
  const mapaData = JSON.parse(await fs.readFile(WAYPOINTS_PATH, 'utf8'));

  await fs.mkdir(path.dirname(STAMPS_OUTPUT_PATH), { recursive: true });

  let existingStamps = [];
  try {
    const existingJson = JSON.parse(await fs.readFile(STAMPS_OUTPUT_PATH, 'utf8'));
    existingStamps = Array.isArray(existingJson) ? existingJson : existingJson.stamps || [];
  } catch {
    // first run
  }
  const existingMap = new Map(existingStamps.map(s => [s.id, s]));

  await cleanPhotosDir();

  const outputStamps = [];
  const outputStories = [];

  for (const wp of mapaData.waypoints) {
    const photos = Array.isArray(wp.photos) ? wp.photos : [];
    const allConsented = photos.every(p => p.consent === true);

    // Rule: C/D points are hidden unless consent is explicitly true.
    if (['C', 'D'].includes(wp.category) && !allConsented) {
      console.log(`[EXPORT] Skipping ${wp.id}: consent not confirmed.`);
      continue;
    }

    const prev = existingMap.get(wp.id);
    const token = prev?.token || generateLongToken();
    const code = prev?.code || generateShortCode(6);
    const radius = prev?.radius || 250;

    const gallery = [];
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      // Rule: any photo with people requires explicit consent.
      if (p.hasPeople && p.consent !== true) continue;

      const meta = await optimizeImage(p.src, `${wp.id}-${i + 1}`);
      if (!meta) continue;
      gallery.push({
        ...meta,
        alt: p.alt || wp.title,
        caption: p.caption || '',
        credit: p.credit || ''
      });
    }

    if (gallery.length === 0) {
      console.warn(`[EXPORT] ${wp.id} has no publishable photos; skipping.`);
      continue;
    }

    const hero = gallery[0];
    const sentences = (wp.description || '').split(/(?<=[.?!])\s+/).filter(Boolean);

    outputStamps.push({
      id: wp.id,
      category: wp.category,
      title: wp.title,
      shortDescription: wp.subtitle || sentences[0] || '[TEXT AICI]',
      coordinates: wp.coordinates,
      photo: hero.src,
      photoMeta: hero,
      token,
      code,
      radius,
      isPhysical: wp.category === 'A'
    });

    // 4 narrative slides from the source description, cycling gallery photos.
    const slides = [];
    for (let s = 0; s < 4; s++) {
      const ph = gallery[s % gallery.length];
      slides.push({
        photo: ph.src,
        photoMeta: ph,
        alt: ph.alt,
        caption: ph.caption,
        credit: ph.credit,
        text: sentences[s] || '[TEXT AICI]',
        didYouKnow: s === 2 ? DID_YOU_KNOW[wp.id] || null : null
      });
    }

    const quiz = wp.category === 'A' ? null : QUIZZES[wp.id] || null;

    outputStories.push({
      id: wp.id,
      category: wp.category,
      title: wp.title,
      subtitle: wp.subtitle || '',
      coordinates: wp.coordinates,
      verified: false, // to be set true by the team after review
      consent: allConsented,
      isPhysical: wp.category === 'A',
      needsReview: wp.category !== 'A' && !quiz,
      slides,
      gallery,
      audio: null,
      audioTranscript: null,
      sources: Array.isArray(wp.sources) && wp.sources.length
        ? wp.sources
        : [{ title: 'Fișa locului din harta interactivă a proiectului „Lider European 2026”', url: '' }],
      quiz
    });
  }

  const stamp = new Date().toISOString();
  await fs.writeFile(STAMPS_OUTPUT_PATH, JSON.stringify({ updatedAt: stamp, total: outputStamps.length, stamps: outputStamps }, null, 2), 'utf8');
  await fs.writeFile(STORIES_OUTPUT_PATH, JSON.stringify({ updatedAt: stamp, total: outputStories.length, stories: outputStories }, null, 2), 'utf8');
  console.log(`[EXPORT] ${outputStamps.length} stamps, ${outputStories.length} stories written.`);
}

runExport().catch(err => {
  console.error('[EXPORT] Error:', err);
  process.exit(1);
});
