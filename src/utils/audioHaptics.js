/**
 * Haptic Vibration and Procedural Web Audio for Stamping, Page Turns & UI Interactions
 * Zero external audio files required — synthesized offline via Web Audio API.
 */

import { APP_CONFIG } from '../config.js';

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function triggerVibration(pattern = [50, 30, 70]) {
  if (typeof window === 'undefined' || !APP_CONFIG.vibrationEnabled) return;
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration error
    }
  }
}

/**
 * Procedural authentic stamp press sound:
 * Low-frequency punch + paper snap resonance
 */
export function playStampSound() {
  if (!APP_CONFIG.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. Thud oscillator (wooden stamp hitting desk)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.12);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);

    // 2. Paper noise snap (filtered buffer)
    const bufferSize = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(t);
  } catch {
    // Audio context may be restricted before user gesture
  }
}

/**
 * Silky parchment paper rustle for page turns & booklet opening
 */
export function playPageFlipSound() {
  if (!APP_CONFIG.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const dur = 0.22;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Pinkish noise curve
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + dur);
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
  } catch {
    // Ignore audio restriction
  }
}

/**
 * Warm harmonic chime for intro reveal & milestone achievements
 */
export function playChimeSound() {
  if (!APP_CONFIG.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const freqs = [528, 660, 792]; // Solfeggio / warm major chord
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.2, t);
    masterGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    masterGain.connect(ctx.destination);

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.3, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(t + idx * 0.06);
      osc.stop(t + 1.2);
    });
  } catch {
    // Ignore audio restriction
  }
}

/**
 * Subtle tactile micro-tap for buttons & interactions
 */
export function playTapSound() {
  playSoftPopSound();
}

/**
 * Soft, pleasant water-droplet / acoustic wooden pop for taps & buttons
 */
export function playSoftPopSound() {
  if (!APP_CONFIG.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.055);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.065);
  } catch {
    // Ignore restrictions
  }
}

/**
 * Global soft audio & haptic feedback for all interactive elements
 */
export function initGlobalSoftFeedback() {
  if (typeof document === 'undefined') return;

  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, a, .map-chip, .btn-map-ctrl, .point-card, .step-card, .osm-marker-wrap, .quiz-opt-btn, .story-tap-zone');
    if (target) {
      playSoftPopSound();
      triggerVibration([20]);
    }
  }, { passive: true });
}
