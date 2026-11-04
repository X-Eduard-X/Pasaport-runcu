/**
 * Cartographic Data & Latitude-Corrected Projections for Comuna Runcu
 * Corrected for latitude 45.18° N (cosLat ≈ 0.7048) to eliminate distortion.
 */

// Bounding box of Comuna Runcu (from runcu-boundary.geojson)
export const MAP_BOUNDS = {
  minLng: 23.0153254,
  maxLng: 23.2317948,
  minLat: 45.0784527,
  maxLat: 45.2912679
};

const MID_LAT = (MAP_BOUNDS.minLat + MAP_BOUNDS.maxLat) / 2;
const LAT_RAD = (MID_LAT * Math.PI) / 180;
const COS_LAT = Math.cos(LAT_RAD);

export const VIEWBOX = {
  width: 600,
  height: 780,
  padding: 35
};

const PROJ_WIDTH = (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng) * COS_LAT;
const PROJ_HEIGHT = MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat;

const SCALE = Math.min(
  (VIEWBOX.width - VIEWBOX.padding * 2) / PROJ_WIDTH,
  (VIEWBOX.height - VIEWBOX.padding * 2) / PROJ_HEIGHT
);

const OFFSET_X = VIEWBOX.padding + ((VIEWBOX.width - VIEWBOX.padding * 2) - PROJ_WIDTH * SCALE) / 2;
const OFFSET_Y = VIEWBOX.padding + ((VIEWBOX.height - VIEWBOX.padding * 2) - PROJ_HEIGHT * SCALE) / 2;

/**
 * Projects [lng, lat] to SVG coordinates [x, y]
 */
export function projectCoordinates(lng, lat) {
  const x = OFFSET_X + (lng - MAP_BOUNDS.minLng) * COS_LAT * SCALE;
  const y = OFFSET_Y + (MAP_BOUNDS.maxLat - lat) * SCALE;
  return [Number(x.toFixed(1)), Number(y.toFixed(1))];
}

/**
 * The 7 official component villages of Comuna Runcu (OSM verified coordinates)
 */
export const RUNCU_VILLAGES = [
  { name: 'Runcu', coords: [23.1423076, 45.1192495] },
  { name: 'Bâlta', coords: [23.1019565, 45.1180532] },
  { name: 'Bâltișoara', coords: [23.1194736, 45.119957] },
  { name: 'Dobrița', coords: [23.1740631, 45.1350352] },
  { name: 'Răchiți', coords: [23.1516824, 45.0975076] },
  { name: 'Suseni', coords: [23.2080101, 45.1408786] },
  { name: 'Valea Mare', coords: [23.0800428, 45.112626] }
].map(v => {
  const [x, y] = projectCoordinates(...v.coords);
  return { ...v, x, y };
});
