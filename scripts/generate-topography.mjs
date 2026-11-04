/**
 * Generates procedural topographic contour lines (isolines) mimicking
 * the elevation gradients of Munții Vâlcan and Valea Sohodolului (Runcu).
 * Saved as a static SVG asset for zero-runtime CPU overhead.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_PATH = path.resolve('public/assets/topography-contours.svg');

// Simple coherent 2D noise approximation with multiple octaves
function noise(x, y) {
  const n1 = Math.sin(x * 1.8 + Math.cos(y * 1.5)) * 0.5 + 0.5;
  const n2 = Math.cos(x * 3.4 - y * 2.8) * 0.25 + 0.25;
  const n3 = Math.sin(x * 0.7 + y * 0.9) * 0.25 + 0.25;
  return n1 * 0.6 + n2 * 0.25 + n3 * 0.15;
}

async function run() {
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });

  const width = 1200;
  const height = 1600;
  const numLevels = 18;
  const paths = [];

  // Generate contours across grid
  const cols = 60;
  const rows = 80;
  const cellW = width / cols;
  const cellH = height / rows;

  const field = [];
  for (let r = 0; r <= rows; r++) {
    field[r] = [];
    for (let c = 0; c <= cols; c++) {
      const nx = c / cols * 3.2;
      const ny = r / rows * 4.2;
      // Ridge along the center representing Valea Sohodolului canyon
      const valley = Math.abs(c / cols - 0.5) * 1.8;
      field[r][c] = noise(nx, ny) * 0.6 + valley * 0.4;
    }
  }

  // Draw smooth iso-paths across each level
  for (let l = 1; l <= numLevels; l++) {
    const isMajor = l % 4 === 0;
    const threshold = l / (numLevels + 1);
    const strokeColor = isMajor ? 'rgba(229, 169, 60, 0.12)' : 'rgba(245, 243, 238, 0.05)';
    const strokeWidth = isMajor ? '1.5' : '0.8';
    const dash = isMajor ? '' : '';

    // Interpolate contour segments across grid rows
    const points = [];
    for (let r = 0; r <= rows; r += 2) {
      for (let c = 0; c <= cols; c += 2) {
        const val = field[r][c];
        if (Math.abs(val - threshold) < 0.045) {
          const px = Number((c * cellW + Math.sin(l + r) * 6).toFixed(1));
          const py = Number((r * cellH + Math.cos(l + c) * 6).toFixed(1));
          points.push([px, py]);
        }
      }
    }

    if (points.length >= 4) {
      // Sort points roughly to form continuous flowing curves
      points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      let d = `M ${points[0][0]},${points[0][1]}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i][0]},${points[i][1]}`;
      }
      paths.push(`
        <path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
      `);
    }
  }

  // Add 4 elevation marks like real topographic maps
  const elevationMarks = [
    { x: 280, y: 350, elev: '1760 m' },
    { x: 820, y: 620, elev: '1240 m' },
    { x: 420, y: 1100, elev: '850 m' },
    { x: 680, y: 1420, elev: '420 m' }
  ].map(m => `
    <text x="${m.x}" y="${m.y}" fill="rgba(229, 169, 60, 0.18)" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="600" letter-spacing="1">
      ${m.elev}
    </text>
  `).join('\n');

  const svgContent = `<!-- Procedural Topographic Contours of Comuna Runcu & Munții Vâlcan -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="topomask" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#fff" stop-opacity="1" />
      <stop offset="80%" stop-color="#fff" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#fff" stop-opacity="0" />
    </radialGradient>
    <mask id="fade-mask">
      <rect width="${width}" height="${height}" fill="url(#topomask)" />
    </mask>
  </defs>
  <g mask="url(#fade-mask)">
    ${paths.join('\n')}
    ${elevationMarks}
  </g>
</svg>
`;

  await fs.writeFile(OUT_PATH, svgContent, 'utf8');
  console.log('[TOPO] Generated procedural topography SVG:', OUT_PATH);
}

run().catch(console.error);
