/**
 * Professional Cinematic Intro Component — "Pașaportul Comunei Runcu"
 *
 * Sequence (~4-5s total):
 *  1. Pure deep night -> Commune boundary draws with a single golden path (strokeDashoffset)
 *  2. Pre-baked static topography contours drift slowly (GPU transform: translate3d),
 *     title reveals on masked lines (zero letter splitting, only line masks)
 *  3. Heritage RUNCU stamp impacts the page (scale + opacity overshoot, no blur filters)
 *  4. 3D Expedition Journal cover lifts and unfolds with pre-baked gradient shadows
 *  5. "Deschide Pașaportul" CTA button appears.
 *
 * Performance Rules:
 *  - Animates EXCLUSIVELY transform and opacity.
 *  - No filter, no backdrop-filter, no box-shadow animation.
 *  - Starts only after document.fonts.ready.
 *  - Single master GSAP timeline.
 *  - "Sari peste" (Skip) appears at t=0.5s and cleanly kills timeline.
 *  - Supports full / lite / minimal tiers.
 *  - Runs once per session (sessionStorage), then short variant.
 */

import { gsap } from 'gsap';
import { RUNCU_BOUNDARY_PATH } from '../data/boundary.js';
import { icon } from './icons.js';
import { getMotionTier, isMinimalMotion, isLiteMotion } from '../utils/quality.js';
import { playChimeSound, playStampSound, playPageFlipSound, triggerVibration, playTapSound } from '../utils/audioHaptics.js';

const STORAGE_SESSION_KEY = 'runcu_intro_completed_session';

export function hasSeenSessionIntro() {
  try {
    return sessionStorage.getItem(STORAGE_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markSessionIntroSeen() {
  try {
    sessionStorage.setItem(STORAGE_SESSION_KEY, 'true');
  } catch {}
}

export function initIntroCinematic({ onComplete } = {}) {
  let masterTimeline = null;
  let overlayEl = null;
  let isExiting = false;

  async function showIntro({ force = false, isShort = false } = {}) {
    const tier = getMotionTier();

    // If already seen this session and not forced, complete immediately
    if (!force && hasSeenSessionIntro()) {
      if (onComplete) onComplete();
      return;
    }

    // Wait for critical resources before rendering the first frame
    try {
      if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise(r => setTimeout(r, 600)) // 600ms timeout max
        ]);
      }
    } catch {}

    // Create full-screen stage
    overlayEl = document.getElementById('intro-cinematic-stage');
    if (!overlayEl) {
      overlayEl = document.createElement('section');
      overlayEl.id = 'intro-cinematic-stage';
      overlayEl.className = 'intro-cinematic-stage';
      overlayEl.setAttribute('role', 'dialog');
      overlayEl.setAttribute('aria-modal', 'true');
      overlayEl.setAttribute('aria-label', 'Prolog cinematic: Pașaportul Comunei Runcu');
      document.body.appendChild(overlayEl);
    }

    // Minimal mode (reduced effects / prefers-reduced-motion): clean instant fade
    if (tier === 'minimal' || isMinimalMotion()) {
      renderMinimalIntro();
      return;
    }

    // Full or Lite Cinematic Sequence
    renderCinematicStage(tier, isShort);
  }

  function renderMinimalIntro() {
    overlayEl.innerHTML = `
      <div class="intro-minimal-wrap">
        <div class="intro-boundary-gold-emblem">
          <svg viewBox="0 0 100 100" class="intro-emblem-svg" aria-hidden="true">
            <path d="${RUNCU_BOUNDARY_PATH}" fill="none" stroke="#D8A24A" stroke-width="3" />
          </svg>
        </div>
        <div class="intro-kicker-badge">Lider European 2026</div>
        <h1 class="intro-title-primary">PAȘAPORTUL COMUNEI RUNCU</h1>
        <p class="intro-lead-desc">Jurnal Digital de Călătorie &amp; Povești Vii din Munții Vâlcan</p>
        <button type="button" class="btn-intro-cta" id="btn-intro-enter-minimal">
          <span>Deschide Pașaportul</span>
        </button>
      </div>
    `;

    const enterBtn = overlayEl.querySelector('#btn-intro-enter-minimal');
    enterBtn?.addEventListener('click', () => {
      playTapSound();
      finishIntro();
    });
  }

  function renderCinematicStage(tier, isShort) {
    overlayEl.innerHTML = `
      <!-- Static Pre-baked Topography Layer (Moved only with GPU transform) -->
      <div class="intro-topo-drift-layer" id="intro-topo-bg" aria-hidden="true"></div>

      <!-- Vignette Gradient Mask -->
      <div class="intro-vignette-overlay" aria-hidden="true"></div>

      <!-- Skip Button: Appears at t=0.5s -->
      <button type="button" class="intro-skip-pill" id="intro-skip-button" aria-label="Sari peste introducere">
        <span>Sari peste</span>
        ${icon('close', 14)}
      </button>

      <!-- Center Stage Container (Grid-stacked two-phase viewport) -->
      <div class="intro-center-viewport" id="intro-center-viewport">
        <!-- Phase 1: Commune Boundary, Title & Seal Medallion -->
        <div class="intro-phase-brand" id="intro-phase-brand">
          <!-- Step 1: Commune Boundary Gold Line -->
          <div class="intro-boundary-anim-box" id="intro-boundary-box">
            <svg viewBox="-4 -4 108 108" class="intro-boundary-svg-live" aria-hidden="true">
              <path d="${RUNCU_BOUNDARY_PATH}" id="intro-vector-gold-path" class="intro-vector-gold-path" />
            </svg>
          </div>

          <!-- Step 2: Masked Title Presentation -->
          <div class="intro-text-presentation" id="intro-text-box">
            <div class="intro-mask-line">
              <span class="intro-kicker-text" id="intro-kicker">COMUNA RUNCU • JUDEȚUL GORJ • 2026</span>
            </div>
            <div class="intro-mask-line">
              <h1 class="intro-main-brand-title" id="intro-brand-title">PAȘAPORTUL COMUNEI RUNCU</h1>
            </div>
            <div class="intro-mask-line">
              <p class="intro-sub-brand-tagline" id="intro-brand-sub">Jurnal Digital de Călătorie &amp; Povești Vii din Munții Vâlcan</p>
            </div>
          </div>

          <!-- Step 3: Heritage RUNCU Official Seal Impact -->
          <div class="intro-seal-stage" id="intro-seal-box">
            <div class="intro-stamp-medallion">
              <div class="intro-stamp-inner">
                <svg viewBox="0 0 120 120" class="intro-stamp-svg" aria-hidden="true">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#D8A24A" stroke-width="2.5" stroke-dasharray="4 2" />
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#D8A24A" stroke-width="1.5" />
                  <path d="M25 60 A35 35 0 0 1 95 60" id="stamp-arc-top" fill="none" />
                  <text font-family="'Plus Jakarta Sans', sans-serif" font-size="8" font-weight="700" fill="#D8A24A" letter-spacing="2">
                    <textPath href="#stamp-arc-top" startOffset="50%" text-anchor="middle">EXPEDIȚIA RUNCU</textPath>
                  </text>
                  <text x="60" y="65" text-anchor="middle" font-family="'Cormorant Garamond', Georgia, serif" font-size="16" font-weight="700" fill="#F5D37E">2026</text>
                  <circle cx="60" cy="78" r="2.5" fill="#D8A24A" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Phase 2: 3D Booklet Cover & Enter CTA Button -->
        <div class="intro-phase-book" id="intro-phase-book" style="opacity: 0; pointer-events: none;">
          <!-- Step 4: 3D Expedition Book Cover Unfold -->
          <div class="intro-book-3d-scene" id="intro-book-scene">
            <div class="intro-journal-card" id="intro-journal-card">
              <!-- Pre-baked static gradient shadow (zero box-shadow animation) -->
              <div class="intro-card-static-shadow" aria-hidden="true"></div>

              <div class="intro-cover-face">
                <div class="intro-cover-gold-crest">
                  <svg viewBox="-4 -4 108 108" class="intro-crest-svg" aria-hidden="true">
                    <path d="${RUNCU_BOUNDARY_PATH}" fill="none" stroke="#D8A24A" stroke-width="2.5" />
                  </svg>
                </div>
                <span class="intro-cover-badge">CARNET OFICIAL</span>
                <h2 class="intro-cover-title">PAȘAPORTUL COMUNEI RUNCU</h2>
                <span class="intro-cover-sub">Comuna Runcu • Munții Vâlcan</span>

                <!-- Institutional Endorsement on 3D Cover -->
                <div class="intro-cover-partners-strip" aria-label="Parteneri oficiali">
                  <img src="./assets/logos/stema-comuna-runcu.png" alt="Comuna Runcu" class="intro-partner-logo stema" width="22" height="34" />
                  <img src="./assets/logos/logo-liceu-runcu.jpg" alt="Liceul Tehnologic" class="intro-partner-logo round" width="26" height="26" />
                  <img src="./assets/logos/logo-lider-european.jpg" alt="Lider European" class="intro-partner-logo rect" width="20" height="26" />
                </div>
              </div>
            </div>
          </div>

          <!-- Step 5: Primary Action Button -->
          <div class="intro-cta-row" id="intro-cta-row">
            <button type="button" class="btn-intro-cta" id="btn-intro-open-journal">
              <span>Deschide Pașaportul</span>
              ${icon('chevronRight', 18)}
            </button>
          </div>
        </div>
      </div>
    `;

    // Elements
    const skipBtn = overlayEl.querySelector('#intro-skip-button');
    const topoBg = overlayEl.querySelector('#intro-topo-bg');
    const phaseBrand = overlayEl.querySelector('#intro-phase-brand');
    const phaseBook = overlayEl.querySelector('#intro-phase-book');
    const boundaryBox = overlayEl.querySelector('#intro-boundary-box');
    const goldPath = overlayEl.querySelector('#intro-vector-gold-path');
    const textBox = overlayEl.querySelector('#intro-text-box');
    const kicker = overlayEl.querySelector('#intro-kicker');
    const title = overlayEl.querySelector('#intro-brand-title');
    const subtitle = overlayEl.querySelector('#intro-brand-sub');
    const sealBox = overlayEl.querySelector('#intro-seal-box');
    const bookScene = overlayEl.querySelector('#intro-book-scene');
    const journalCard = overlayEl.querySelector('#intro-journal-card');
    const ctaRow = overlayEl.querySelector('#intro-cta-row');
    const openBtn = overlayEl.querySelector('#btn-intro-open-journal');

    // Prepare SVG path length
    let pathLength = 320;
    if (goldPath && goldPath.getTotalLength) {
      try {
        pathLength = Math.ceil(goldPath.getTotalLength());
      } catch {}
    }
    goldPath.style.strokeDasharray = `${pathLength}`;
    goldPath.style.strokeDashoffset = `${pathLength}`;

    // Master Timeline
    masterTimeline = gsap.timeline({
      onComplete: () => {
        // Timeline finished, ready for user interaction
      }
    });

    // 0.0s: Skip button reveals gently at t=0.5s
    masterTimeline.to(skipBtn, {
      opacity: 1,
      duration: 0.35,
      ease: 'power2.out'
    }, 0.5);

    // 0.1s - 1.2s: Step 1: Draw golden commune boundary outline
    masterTimeline.to(goldPath, {
      strokeDashoffset: 0,
      duration: 1.15,
      ease: 'power2.out'
    }, 0.1);

    // Play subtle opening chime
    setTimeout(() => {
      playChimeSound();
    }, 200);

    // 0.4s: Step 2: Background topography drifts slowly via GPU transform
    masterTimeline.to(topoBg, {
      x: -24,
      y: -14,
      opacity: 0.32,
      duration: 3.5,
      ease: 'none'
    }, 0.4);

    // 1.0s: Step 2: Boundary gently scales (centered, no clipping)
    masterTimeline.to(boundaryBox, {
      scale: 0.88,
      duration: 0.5,
      ease: 'power2.out'
    }, 1.0);

    // 1.15s: Masked title revelation (lines lift into place)
    masterTimeline.fromTo([kicker, title, subtitle], {
      y: 24,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.55,
      stagger: 0.1,
      ease: 'power3.out'
    }, 1.15);

    // 2.1s: Step 3: Heritage Stamp impacts page
    masterTimeline.fromTo(sealBox, {
      scale: 2.1,
      opacity: 0,
      rotate: -12
    }, {
      scale: 1,
      opacity: 1,
      rotate: 0,
      duration: 0.45,
      ease: 'back.out(1.5)',
      onStart: () => {
        playStampSound();
        triggerVibration([30, 20, 50]);
      }
    }, 2.1);

    // 2.85s: Phase 1 fades smoothly and yields center to Phase 2
    masterTimeline.to(phaseBrand, {
      opacity: 0,
      scale: 0.94,
      y: -12,
      duration: 0.38,
      ease: 'power2.in',
      onComplete: () => {
        if (phaseBrand) phaseBrand.style.visibility = 'hidden';
      }
    }, 2.85);

    // 3.0s: Step 4: Phase 2 (3D Journal Cover) rises into center
    masterTimeline.fromTo(phaseBook, {
      opacity: 0,
      scale: 0.9,
      y: 16
    }, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
      onStart: () => {
        if (phaseBook) {
          phaseBook.style.visibility = 'visible';
          phaseBook.style.pointerEvents = 'auto';
        }
      }
    }, 3.0);

    if (tier === 'full') {
      masterTimeline.fromTo(journalCard, {
        rotateY: -20,
        rotateX: 8
      }, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.65,
        ease: 'power2.out',
        onStart: () => playPageFlipSound()
      }, 3.1);
    }

    // 3.45s: Step 5: CTA Button appears
    masterTimeline.fromTo(ctaRow, {
      opacity: 0,
      y: 12
    }, {
      opacity: 1,
      y: 0,
      duration: 0.38,
      ease: 'power2.out'
    }, 3.45);

    // Event listeners
    skipBtn?.addEventListener('click', () => {
      playTapSound();
      finishIntro();
    });

    openBtn?.addEventListener('click', () => {
      playPageFlipSound();
      triggerVibration([40, 20, 60]);
      finishIntro();
    });
  }

  function finishIntro() {
    if (isExiting) return;
    isExiting = true;
    markSessionIntroSeen();

    if (masterTimeline) {
      masterTimeline.kill();
      masterTimeline = null;
    }

    if (overlayEl) {
      // Smooth clean aperture exit (transform + opacity only)
      gsap.to(overlayEl, {
        opacity: 0,
        scale: 1.03,
        duration: 0.35,
        ease: 'power2.inOut',
        onComplete: () => {
          overlayEl?.remove();
          overlayEl = null;
          isExiting = false;
          if (onComplete) onComplete();
        }
      });
    } else {
      isExiting = false;
      if (onComplete) onComplete();
    }
  }

  // Global event listener for re-opening intro from header/footer
  window.addEventListener('open-intro-cinematic', () => {
    showIntro({ force: true });
  });

  return { showIntro, finishIntro };
}
