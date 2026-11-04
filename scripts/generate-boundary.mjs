import fs from 'node:fs/promises';
import path from 'node:path';

const MAP_DIR = path.resolve('C:/Users/Edy/Downloads/mapa');
const BOUNDARY_GEOJSON_PATH = path.join(MAP_DIR, 'data', 'runcu-boundary.geojson');
const OUT_PATH = path.resolve('src/data/boundary.js');

async function run() {
  const raw = await fs.readFile(BOUNDARY_GEOJSON_PATH, 'utf8');
  const geojson = JSON.parse(raw);
  const ring = geojson.features[0].geometry.coordinates[0];

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }

  const padding = 5;
  const width = maxX - minX;
  const height = maxY - minY;
  const scale = (100 - padding * 2) / Math.max(width, height);
  const offsetX = padding + ((100 - padding * 2) - width * scale) / 2;
  const offsetY = padding + ((100 - padding * 2) - height * scale) / 2;

  const simplified = [];
  let lastX = -999, lastY = -999;
  for (const [x, y] of ring) {
    const sx = Number((offsetX + (x - minX) * scale).toFixed(1));
    const sy = Number((offsetY + (maxY - y) * scale).toFixed(1));
    const dist = Math.hypot(sx - lastX, sy - lastY);
    if (dist >= 0.35 || simplified.length === 0) {
      simplified.push([sx, sy]);
      lastX = sx;
      lastY = sy;
    }
  }

  if (simplified[0][0] !== simplified[simplified.length - 1][0] || simplified[0][1] !== simplified[simplified.length - 1][1]) {
    simplified.push(simplified[0]);
  }

  const pathD = 'M ' + simplified.map(([x, y]) => `${x},${y}`).join(' L ') + ' Z';
  console.log(`Boundary points: original ${ring.length} -> simplified ${simplified.length}`);

  const content = `/**
 * Official administrative boundary silhouette of Comuna Runcu, Jud. Gorj
 * Normalized to 0 0 100 100 viewBox
 */
export const RUNCU_BOUNDARY_PATH = "${pathD}";
`;

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, content, 'utf8');
  console.log('Saved boundary to', OUT_PATH);
}

run().catch(console.error);
