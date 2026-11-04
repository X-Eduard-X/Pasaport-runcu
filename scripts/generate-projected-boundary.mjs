import fs from 'node:fs/promises';
import path from 'node:path';
import { projectCoordinates } from '../src/data/mapData.js';

const MAPA_GEOJSON = path.resolve('C:/Users/Edy/Downloads/mapa/data/runcu-boundary.geojson');
const OUT_FILE = path.resolve('src/data/projectedBoundary.js');

async function run() {
  const raw = await fs.readFile(MAPA_GEOJSON, 'utf8');
  const geojson = JSON.parse(raw);
  const ring = geojson.features[0].geometry.coordinates[0];

  const simplified = [];
  let lastX = -999, lastY = -999;
  for (const [lng, lat] of ring) {
    const [x, y] = projectCoordinates(lng, lat);
    const dist = Math.hypot(x - lastX, y - lastY);
    if (dist >= 1.5 || simplified.length === 0) {
      simplified.push([x, y]);
      lastX = x;
      lastY = y;
    }
  }

  if (simplified[0][0] !== simplified[simplified.length - 1][0] || simplified[0][1] !== simplified[simplified.length - 1][1]) {
    simplified.push(simplified[0]);
  }

  const pathD = 'M ' + simplified.map(([x, y]) => `${x},${y}`).join(' L ') + ' Z';
  console.log(`Original points: ${ring.length} -> Projected simplified: ${simplified.length}`);

  const content = `/**
 * Official administrative boundary silhouette of Comuna Runcu
 * Projected to 0 0 600 780 viewBox with latitude correction (cosLat)
 */
export const PROJECTED_BOUNDARY_PATH = "${pathD}";
`;

  await fs.writeFile(OUT_FILE, content, 'utf8');
  console.log('Saved projected boundary to', OUT_FILE);
}

run().catch(console.error);
