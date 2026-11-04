/**
 * Adaptive Quality & Motion Tiers
 * Supports three levels:
 *  - 'full': High-end desktop and modern mobile devices (full GSAP transitions, 3D folds, embers)
 *  - 'lite': Budget phones (simplified transforms, no particles, reduced layers)
 *  - 'minimal': Extremely low-end devices or users with prefers-reduced-motion / 'Efecte reduse' toggle
 * Remembers manual user preference in localStorage ('runcu_reduced_effects').
 */
import { prefersReducedMotion } from '../tokens.js';

const STORAGE_KEY_REDUCED = 'runcu_reduced_effects';
let currentTier = null;

export function isReducedEffectsEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY_REDUCED) === 'true';
  } catch {
    return false;
  }
}

export function setReducedEffectsEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY_REDUCED, enabled ? 'true' : 'false');
    currentTier = null; // force re-evaluation
    document.documentElement.dataset.motion = getMotionTier();
  } catch {}
}

function detectHardwareTier() {
  if (isReducedEffectsEnabled() || prefersReducedMotion()) {
    return 'minimal';
  }

  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4; // in GB
  const saveData = nav.connection?.saveData;

  if (saveData || cores <= 2 || memory <= 2) {
    return 'lite';
  }

  return 'full';
}

export function getMotionTier() {
  if (!currentTier) {
    currentTier = detectHardwareTier();
  }
  return currentTier;
}

export function isFullMotion() {
  return getMotionTier() === 'full';
}

export function isLiteMotion() {
  return getMotionTier() === 'lite';
}

export function isMinimalMotion() {
  return getMotionTier() === 'minimal';
}

/**
 * 500ms FPS probe during startup; downgrades automatically if average FPS < 40
 */
export function runStartupFpsProbe() {
  if (getMotionTier() !== 'full' || typeof requestAnimationFrame === 'undefined') return;

  let frames = 0;
  let startTime = 0;
  const PROBE_DURATION_MS = 500;

  function probeStep(now) {
    if (!startTime) startTime = now;
    frames++;
    const elapsed = now - startTime;

    if (elapsed < PROBE_DURATION_MS) {
      requestAnimationFrame(probeStep);
    } else {
      const measuredFps = (frames * 1000) / elapsed;
      if (measuredFps < 40) {
        currentTier = 'lite';
        document.documentElement.dataset.motion = 'lite';
      }
    }
  }

  requestAnimationFrame(probeStep);
}
