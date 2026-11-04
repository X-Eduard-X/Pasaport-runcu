/**
 * Unlock View — Handles QR Scan Link (#/stampila/<id>/<token>)
 * Validates token, triggers authentic GSAP stamp impact animation, haptic vibration & sound.
 */

import { gsap } from 'gsap';
import confetti from 'canvas-confetti';
import { CATEGORY_META, prefersReducedMotion } from '../tokens.js';
import { generateStampSvg } from '../components/StampSvg.js';
import { unlockStamp, isStampUnlocked, getStampUnlockInfo } from '../services/storage.js';
import { triggerVibration, playStampSound } from '../utils/audioHaptics.js';
import { verifyUserLocation } from '../utils/geo.js';
import { icon } from '../components/icons.js';
import { picture } from '../utils/img.js';
import { RUNCU_BOUNDARY_PATH } from '../data/boundary.js';

export async function renderUnlockView(stampId, token, stampsData, container) {
  const stamp = stampsData.find(s => s.id === stampId);

  // Validate token
  const isValidToken = stamp && stamp.token && (stamp.token.toLowerCase() === (token || '').toLowerCase());

  if (!stamp || !isValidToken) {
    container.innerHTML = `
      <header class="app-header">
        <div class="app-brand">
          <svg class="brand-emblem-mini" viewBox="-4 -4 108 108" fill="none" stroke="currentColor" stroke-width="3.5" aria-hidden="true">
            <path d="${RUNCU_BOUNDARY_PATH}" fill="currentColor" fill-opacity="0.2"/>
          </svg>
          <div class="brand-text-col">
            <span class="brand-title">Pașaportul Runcului</span>
            <span class="brand-subtitle">Lider European 2026</span>
          </div>
        </div>
        <div class="header-actions">
          <a href="#/" class="btn-header-code">
            ${icon('back', 16)}
            <span>Acasă</span>
          </a>
        </div>
      </header>

      <div class="unlock-page-wrapper">
        <div class="unlock-view">
          <div style="margin: 1.5rem auto 1.25rem; width: 64px; height: 64px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); display: grid; place-items: center; color: #ef4444;" aria-hidden="true">
            ${icon('alert', 32)}
          </div>

          <h1 class="unlock-title">Cod de Teren Nerecunoscut</h1>
          <p class="hero-lead" style="margin-bottom: 2rem; max-width: 440px;">
            Ștampila nu a putut fi validată automat. Folosește mecanismul de ștampilare pentru a introduce cifrul de pe panou.
          </p>

          <div class="unlock-actions-row">
            <button type="button" class="btn-primary-action" id="btn-err-manual-code">
              ${icon('key', 18)}
              <span>Deschide Cifrul Mecanic</span>
            </button>
            <a href="#/" class="btn-secondary-action">
              ${icon('back', 16)}
              <span>Înapoi la pagina principală</span>
            </a>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btn-err-manual-code')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-code-modal'));
    });
    return;
  }

  // Check if previously unlocked
  const alreadyUnlocked = isStampUnlocked(stamp.id);
  let unlockInfo = null;
  let isNewUnlock = false;

  if (alreadyUnlocked) {
    unlockInfo = getStampUnlockInfo(stamp.id);
  } else {
    // Optional location verification
    let locationResult = { verified: false };
    try {
      locationResult = await verifyUserLocation(stamp.coordinates, stamp.radius);
    } catch {
      // Ignore location error, proceed with unverified
    }

    const res = unlockStamp(stamp.id, {
      verified: locationResult.verified,
      method: 'qr'
    });
    unlockInfo = res.info;
    isNewUnlock = true;
  }

  const cat = CATEGORY_META[stamp.category] || CATEGORY_META.A;
  const stampMarkup = generateStampSvg(stamp, unlockInfo, { size: 190 });

  container.innerHTML = `
    <!-- Top Brand Header for Unlock Page -->
    <header class="app-header">
      <div class="app-brand">
        <svg class="brand-emblem-mini" viewBox="-4 -4 108 108" fill="none" stroke="currentColor" stroke-width="3.5" aria-hidden="true">
          <path d="${RUNCU_BOUNDARY_PATH}" fill="currentColor" fill-opacity="0.2"/>
        </svg>
        <div class="brand-text-col">
          <span class="brand-title">Pașaportul Runcului</span>
          <span class="brand-subtitle">Lider European 2026</span>
        </div>
      </div>
      <div class="header-actions">
        <a href="#/pasaport" class="passport-pill-counter" title="Vezi pașaportul" aria-label="Vezi pașaportul">
          ${icon('book', 16)}
          <span>Pașaport</span>
          ${icon('chevronRight', 14)}
        </a>
      </div>
    </header>

    <div class="unlock-page-wrapper">
      <div class="unlock-view">
        <div class="unlock-status-badge ${isNewUnlock ? 'is-success' : 'is-already'}">
          ${isNewUnlock ? `${icon('checkCircle', 16)} <span>Ștampilă Nouă Adăugată!</span>` : `${icon('check', 16)} <span>Deja Înregistrată în Pașaport</span>`}
        </div>

        <h1 class="unlock-title">${stamp.title}</h1>
        <p class="unlock-date-stamp">
          ${isNewUnlock ? 'Ștampilat chiar acum' : `Ștampilat pe ${unlockInfo.dateFormatted} la ${unlockInfo.timeFormatted}`}
          ${unlockInfo?.verified ? ' • Locație confirmată' : ''}
        </p>

        <!-- Stamp Stage with Impact Animation -->
        <div class="stamp-stage-area" id="stamp-stage">
          <div class="ink-splatter-bg" id="ink-splatter" style="--stamp-glow: ${cat.glow}"></div>
          <div id="stamp-element-wrap">
            ${stampMarkup}
          </div>
        </div>

        <!-- Place Info Card -->
        <article class="unlock-place-card">
          ${picture(stamp.photoMeta, {
            alt: stamp.photoMeta?.alt || stamp.title,
            className: 'unlock-place-card__img',
            fallbackSrc: stamp.photo
          })}
          <div class="unlock-place-card__body">
            <div class="unlock-place-card__cat" style="--cat-color: ${cat.color}">
              ${cat.iconSvg}
              <span>${cat.labelRo}</span>
            </div>
            <h2 class="unlock-place-card__title">${stamp.title}</h2>
            <p class="unlock-place-card__desc">${stamp.shortDescription}</p>
          </div>
        </article>

        <!-- Action Buttons -->
        <div class="unlock-actions-row">
          <a href="#/pasaport" class="btn-primary-action">
            ${icon('book', 18)}
            <span>Deschide Pașaportul</span>
          </a>

          <a href="#/" class="btn-secondary-action">
            ${icon('back', 16)}
            <span>Înapoi la lista locurilor</span>
          </a>
        </div>
      </div>
    </div>
  `;

  // Animate Stamp with GSAP
  const stampEl = container.querySelector('#stamp-element-wrap');
  const splatterEl = container.querySelector('#ink-splatter');
  const stageEl = container.querySelector('#stamp-stage');

  if (stampEl && !prefersReducedMotion()) {
    if (isNewUnlock) {
      // Impact sequence: high scale descent -> thud bounce -> ink bleed splatter -> camera shake
      gsap.set(stampEl, {
        scale: 2.8,
        opacity: 0,
        rotation: -28,
        filter: 'blur(4px)'
      });

      const tl = gsap.timeline({
        onComplete: () => {
          // Trigger haptics and sound at exact impact
          triggerVibration([60, 40, 80]);
          playStampSound();
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.35 },
            colors: [cat.color, '#E5A93C', '#F5F3EE']
          });
        }
      });

      tl.to(stampEl, {
        scale: 1,
        opacity: 1,
        rotation: 0,
        filter: 'blur(0px)',
        duration: 0.65,
        ease: 'power3.in',
        delay: 0.15
      })
      .to(splatterEl, {
        opacity: 0.85,
        scale: 1.15,
        duration: 0.25,
        ease: 'power2.out'
      }, '-=0.08')
      .to(stageEl, {
        x: '+=4',
        yoyo: true,
        repeat: 3,
        duration: 0.05,
        ease: 'sine.inOut'
      }, '-=0.1')
      .to(splatterEl, {
        opacity: 0.4,
        scale: 1,
        duration: 0.8,
        ease: 'power1.out'
      });
    } else {
      // Gentle reveal if already unlocked
      gsap.from(stampEl, {
        scale: 0.85,
        opacity: 0,
        duration: 0.5,
        ease: 'back.out(1.5)'
      });
    }
  }
}
