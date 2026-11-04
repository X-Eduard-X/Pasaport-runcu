/**
 * Generates official Guilloche security patterns (mathematical hypotrochoid curves)
 * for the passport booklet pages border and rosette watermark.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_PATH = path.resolve('public/assets/guilloche-pattern.svg');

function generateRosette(cx, cy, R, r, d, steps = 360, cycles = 6) {
  const points = [];
  const maxTheta = Math.PI * 2 * cycles;
  const dTheta = maxTheta / steps;

  for (let theta = 0; theta <= maxTheta; theta += dTheta) {
    const x = (R - r) * Math.cos(theta) + d * Math.cos(((R - r) / r) * theta);
    const y = (R - r) * Math.sin(theta) - d * Math.sin(((R - r) / r) * theta);
    points.push([Number((cx + x).toFixed(1)), Number((cy + y).toFixed(1))]);
  }

  return 'M ' + points.map(p => `${p[0]},${p[1]}`).join(' L ') + ' Z';
}

function generateWeave(w, h) {
  let path1 = `M 0 ${h / 2}`;
  let path2 = `M 0 ${h / 2}`;
  const freq = 0.08;
  const amp = h * 0.35;

  for (let x = 0; x <= w; x += 4) {
    const y1 = h / 2 + Math.sin(x * freq) * amp * Math.cos(x * 0.02);
    const y2 = h / 2 - Math.sin(x * freq) * amp * Math.cos(x * 0.02);
    path1 += ` L ${x} ${Number(y1.toFixed(1))}`;
    path2 += ` L ${x} ${Number(y2.toFixed(1))}`;
  }
  return { path1, path2 };
}

async function run() {
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });

  const r1 = generateRosette(100, 100, 70, 24, 45, 480, 12);
  const r2 = generateRosette(100, 100, 60, 18, 35, 400, 9);
  const { path1, path2 } = generateWeave(600, 30);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200" width="100%" height="100%">
  <defs>
    <pattern id="guilloche-weave" width="600" height="30" patternUnits="userSpaceOnUse">
      <path d="${path1}" fill="none" stroke="rgba(229,169,60,0.18)" stroke-width="0.75" />
      <path d="${path2}" fill="none" stroke="rgba(18,158,115,0.12)" stroke-width="0.75" />
    </pattern>
  </defs>
  <!-- Rosette Seal Watermark -->
  <g transform="translate(200, 0)" opacity="0.15">
    <path d="${r1}" fill="none" stroke="#E5A93C" stroke-width="0.8" />
    <path d="${r2}" fill="none" stroke="#E5A93C" stroke-width="0.6" stroke-dasharray="2 1" />
  </g>
</svg>`;

  await fs.writeFile(OUT_PATH, svg, 'utf8');
  console.log('[GUILLOCHE] Generated guilloche security pattern at', OUT_PATH);
}

run().catch(console.error);
