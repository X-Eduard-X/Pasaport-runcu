/**
 * Ephemeral Client-Side Geolocation Verification
 * Privacy Guarantee: Coordinates are never stored, logged, or transmitted.
 */

import { APP_CONFIG } from '../config.js';

/**
 * Calculates distance in meters using Haversine formula
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const deltaPhi = (lat2 - lat1) * rad;
  const deltaLambda = (lon2 - lon1) * rad;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates bearing from start to destination coordinates in degrees (0-360)
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const deltaLambda = (lon2 - lon1) * rad;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round(bearing / 45) % 8;

  return { degrees: Math.round(bearing), cardinal: cardinals[idx] };
}

/**
 * Verifies if the device is within target radius
 * @param {[number, number]} targetCoords [longitude, latitude]
 * @param {number} radiusMeters
 */
export async function verifyUserLocation(targetCoords, radiusMeters = 250) {
  if (!APP_CONFIG.verifyLocation) {
    return { verified: false, reason: 'disabled' };
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return { verified: false, reason: 'unsupported' };
  }

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const [targetLng, targetLat] = targetCoords;

        const distance = calculateHaversineDistance(userLat, userLng, targetLat, targetLng);
        if (distance <= radiusMeters) {
          resolve({ verified: true, distance: Math.round(distance) });
        } else {
          resolve({
            verified: false,
            reason: 'outside_radius',
            distance: Math.round(distance)
          });
        }
      },
      err => {
        resolve({ verified: false, reason: 'permission_denied_or_error', error: err.message });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 15000
      }
    );
  });
}
