/**
 * Expedition Journal ("Jurnal de Expediție") View
 *
 * Features:
 *  - Responsive PC & Mobile:
 *      * Mobile (< 768px): Single page flip with swipe gestures
 *      * Desktop (>= 1024px): "Birou de explorator" 2-page spread + Companion Map + Cross-linking
 *  - Living Cover ("Coperta vie"): Gold foil specular reflection (tilt/pointer) + engraved stamp insignias
 *  - Physical Stamping (Drag & Long-Press ink charge with authentic impact & sound)
 *  - Presentation Mode (Key P / Button): Clean UI & enlarged typography for 1920x1080 projectors
 *  - Keyboard shortcuts (Arrows, M, P, F, Esc)
 */

import { gsap } from 'gsap';
import confetti from 'canvas-confetti';
import { CATEGORY_META, THEME_TOKENS, prefersReducedMotion } from '../tokens.js';
import { RUNCU_BOUNDARY_PATH } from '../data/boundary.js';
import { generateStampSvg, generateLockedSlotSvg } from '../components/StampSvg.js';
import {
  getPassportData,
  isStampUnlocked,
  getStampUnlockInfo,
  unlockStamp,
  setUserName,
  getUserName,
  resetPassport
} from '../services/storage.js';
import { icon } from '../components/icons.js';
import { playPageFlipSound, triggerVibration, playStampSound, playTapSound } from '../utils/audioHaptics.js';
import { createMiniMap } from '../components/MiniMap.js';

export function renderPassportView(stampsData, container, { initialPage = 0 } = {}) {
  const passport = getPassportData();
  const currentName = getUserName();
  const totalCount = stampsData.length;
  const unlockedMap = passport.unlocked || {};
  const unlockedCount = Object.keys(unlockedMap).length;
  const isCompleted = unlockedCount >= totalCount && totalCount > 0;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  // Group stamps by category for pages
  const catAStamps = stampsData.filter(s => s.category === 'A');
  const catBStamps = stampsData.filter(s => s.category === 'B');
  const catCDStamps = stampsData.filter(s => ['C', 'D'].includes(s.category));

  // Category counts
  const catStats = {
    A: { unlocked: catAStamps.filter(s => isStampUnlocked(s.id)).length, total: catAStamps.length },
    B: { unlocked: catBStamps.filter(s => isStampUnlocked(s.id)).length, total: catBStamps.length },
    C: { unlocked: stampsData.filter(s => s.category === 'C' && isStampUnlocked(s.id)).length, total: stampsData.filter(s => s.category === 'C').length },
    D: { unlocked: stampsData.filter(s => s.category === 'D' && isStampUnlocked(s.id)).length, total: stampsData.filter(s => s.category === 'D').length }
  };

  // State
  let isCoverOpen = true;
  let currentPage = initialPage; // 0: Overview, 1: Cat A, 2: Cat B, 3: Cat C & D
  const totalPages = 4;
  let isPresentationMode = document.body.classList.contains('presentation-mode');

  container.innerHTML = `
    <!-- Top Header Navigation -->
    <header class="app-header">
      <div class="app-brand">
        <img src="./assets/logos/stema-comuna-runcu.png" alt="Stema Comunei Runcu" class="brand-crest-stema" width="28" height="44" />
        <a href="#/" class="btn-hdr-back" title="Înapoi la mini-hartă" aria-label="Înapoi la prima pagină">
          ${icon('back', 18)}
          <span class="brand-title">Jurnal de Expediție</span>
        </a>
      </div>
      <div class="header-actions">
        <button type="button" class="btn-header-code" id="btn-toggle-presentation" title="Comută modul prezentare pentru videoproiector" aria-label="Mod Prezentare">
          ${icon('sparkle', 16)}
          <span>Prezentare</span>
        </button>
        <button type="button" class="btn-header-code" id="btn-toggle-cover" title="Vezi coperta exterioară" aria-label="Schimbă între copertă și pagini">
          ${icon('cover', 16)}
          <span id="label-toggle-cover">Copertă</span>
        </button>
        <button type="button" class="btn-header-code desktop-only" id="btn-toggle-fullscreen" title="Ecran complet" aria-label="Ecran complet">
          ${icon('zoomIn', 16)}
          <span>Fullscreen</span>
        </button>
        <span class="passport-pill-counter" aria-label="${unlockedCount} din ${totalCount} ștampile obținute">
          ${unlockedCount}/${totalCount}
        </span>
      </div>
    </header>

    <!-- Presentation Mode Exit Bar -->
    <aside class="presentation-exit-banner" id="presentation-exit-bar" ${isPresentationMode ? '' : 'hidden'}>
      <span>MOD PREZENTARE ACTIV • REZOLUȚIE 1920×1080</span>
      <button type="button" class="btn-exit-presentation" id="btn-exit-presentation-inner">Ieșire (Tasta P / Esc)</button>
    </aside>

    <main class="journal-viewport">
      <!-- DESKTOP EXPLORER DESK LAYOUT CONTAINER -->
      <div class="explorer-desk-grid">
        <!-- 3D BOOKLET WRAPPER -->
        <div class="journal-booklet-3d" id="booklet-3d">
          <!-- 1. EMBOSSED LEATHER LIVING COVER -->
          <div class="journal-cover-shell ${isCoverOpen ? 'is-folded' : 'is-visible'}" id="journal-cover" aria-label="Coperta pașaportului">
            <div class="cover-leather-texture" aria-hidden="true"></div>
            <div class="cover-stitch-border" aria-hidden="true"></div>

            <!-- Specular Gold Leaf Reflection Container -->
            <div class="cover-emblem-foil-wrap" id="foil-wrap">
              <div class="foil-glint-reflection" id="foil-glint" aria-hidden="true"></div>
              <svg class="cover-boundary-foil" viewBox="0 0 100 100" fill="none" aria-hidden="true">
                <path d="${RUNCU_BOUNDARY_PATH}" class="foil-path-base" />
                <path d="${RUNCU_BOUNDARY_PATH}" class="foil-path-glow" />
              </svg>
            </div>

            <div class="cover-typography">
              <div class="cover-sub-foil">COMUNA RUNCU • JUDEȚUL GORJ</div>
              <h1 class="cover-main-title">PAȘAPORTUL COMUNEI RUNCU</h1>
              <div class="cover-seal-tag">LIDER EUROPEAN 2026</div>
            </div>

            <!-- Living Cover Institutional Crests -->
            <div class="cover-partners-crest-strip" aria-label="Parteneri oficiali">
              <img src="./assets/logos/stema-comuna-runcu.png" alt="Stema Runcu" class="cover-crest-stema" width="24" height="38" />
              <img src="./assets/logos/logo-liceu-runcu.jpg" alt="Liceul Tehnologic" class="cover-crest-round" width="28" height="28" />
              <img src="./assets/logos/logo-lider-european.jpg" alt="Lider European" class="cover-crest-rect" width="22" height="28" />
            </div>

            <!-- Living Cover Stamp Badges -->
            <div class="cover-insignias-row" aria-label="Insignele colectate">
              ${stampsData.map(st => {
                const unlocked = isStampUnlocked(st.id);
                return `
                  <div class="cover-badge-coin ${unlocked ? 'is-unlocked' : 'is-empty'}" title="${st.title}">
                    <span class="cover-badge-symbol">${unlocked ? icon('check', 10) : ''}</span>
                  </div>
                `;
              }).join('')}
            </div>

            <button type="button" class="btn-open-booklet-cta" id="btn-open-booklet" aria-label="Deschide paginile jurnalului">
              <span>Deschide Jurnalul</span>
              ${icon('chevronRight', 16)}
            </button>
          </div>

          <!-- 2. WARM PAPER EXPEDITION PAGES SPREAD -->
          <div class="journal-pages-spread ${isCoverOpen ? 'is-active' : 'is-hidden'}" id="journal-pages" aria-label="Paginile jurnalului">
            <!-- Guilloche Security Pattern Layer -->
            <div class="guilloche-bg-watermark" aria-hidden="true"></div>

            <!-- PAGE CONTAINER (FLIPPABLE & TWO-PAGE DESK SPREAD) -->
            <div class="paper-page-content" id="active-page-content" role="region" aria-live="polite">
              <!-- Dynamic page content injected below -->
            </div>

            <!-- Booklet Footer Bar & Page Turn Controls -->
            <footer class="booklet-footer-nav" aria-label="Navigare pagini">
              <button type="button" class="btn-page-turn" id="btn-prev-page" aria-label="Pagina anterioară">
                ${icon('chevronLeft', 16)}
                <span>Înapoi</span>
              </button>

              <div class="page-number-pill" id="page-indicator" aria-current="page">
                Pagina ${currentPage + 1} din ${totalPages}
              </div>

              <button type="button" class="btn-page-turn" id="btn-next-page" aria-label="Pagina următoare">
                <span>Înainte</span>
                ${icon('chevronRight', 16)}
              </button>
            </footer>
          </div>
        </div>

        <!-- 3. DESKTOP COMPANION SIDEBAR (MINI-MAP & RADAR) -->
        <aside class="desktop-explorer-sidebar desktop-only" aria-label="Harta companion de birou">
          <div class="companion-sidebar-header">
            <h3 class="companion-title">${icon('compass', 16)} Harta de Birou</h3>
            <span class="companion-sub">Atinge sau treci cu mouse-ul peste ștampile</span>
          </div>
          <div id="desktop-companion-map-mount" class="desktop-map-companion-mount"></div>
        </aside>
      </div>

      <!-- Reset & Privacy Footer Note -->
      <div class="passport-footer-notes">
        <p class="privacy-note">
          ${icon('lock', 14)}
          <span>Datele și ștampilele sunt salvate strict pe telefonul tău. Scurtături: Săgeți (pagini), M (hartă), P (prezentare), Esc (închide).</span>
        </p>
        <button type="button" class="btn-reset-passport" id="btn-reset-passport" aria-label="Resetează ștampilele locale">
          Resetează ștampilele de pe acest telefon
        </button>
      </div>
    </main>
  `;

  const coverEl = container.querySelector('#journal-cover');
  const pagesEl = container.querySelector('#journal-pages');
  const activePageEl = container.querySelector('#active-page-content');
  const pageIndicator = container.querySelector('#page-indicator');
  const prevBtn = container.querySelector('#btn-prev-page');
  const nextBtn = container.querySelector('#btn-next-page');
  const toggleCoverBtn = container.querySelector('#btn-toggle-cover');
  const labelToggle = container.querySelector('#label-toggle-cover');
  const openBookletBtn = container.querySelector('#btn-open-booklet');
  const foilWrap = container.querySelector('#foil-wrap');
  const foilGlint = container.querySelector('#foil-glint');
  const presentationBtn = container.querySelector('#btn-toggle-presentation');
  const presentationExitBar = container.querySelector('#presentation-exit-bar');
  const presentationExitBtn = container.querySelector('#btn-exit-presentation-inner');
  const fullscreenBtn = container.querySelector('#btn-toggle-fullscreen');

  // Initialize Desktop Companion Map
  const companionMount = container.querySelector('#desktop-companion-map-mount');
  if (companionMount && window.innerWidth >= 1024) {
    createMiniMap(companionMount, stampsData);
  }

  // Render Specific Booklet Page (Single Page on Mobile, Two-Page Spread on Desktop)
  function renderPage(pageIndex, isInitial = false) {
    const isDesktop = window.innerWidth >= 1024;
    const maxPage = isDesktop ? Math.ceil(totalPages / 2) - 1 : totalPages - 1;
    const targetPage = Math.max(0, Math.min(maxPage, pageIndex));

    if (!isInitial && targetPage !== currentPage) {
      playPageFlipSound();
      triggerVibration([25]);
    }
    currentPage = targetPage;

    if (isDesktop) {
      pageIndicator.textContent = `Filele ${currentPage * 2 + 1}–${Math.min(totalPages, currentPage * 2 + 2)} din ${totalPages}`;
      prevBtn.disabled = currentPage === 0;
      nextBtn.disabled = currentPage === maxPage;
    } else {
      pageIndicator.textContent = `Pagina ${currentPage + 1} din ${totalPages}`;
      prevBtn.disabled = currentPage === 0;
      nextBtn.disabled = currentPage === totalPages - 1;
    }

    let html = '';

    if (isDesktop) {
      // TWO-PAGE DESK SPREAD
      const leftPageIndex = currentPage * 2;
      const rightPageIndex = currentPage * 2 + 1;

      html = `
        <div class="two-page-desk-spread">
          <div class="desk-page-leaf leaf-left">
            ${getPageHtml(leftPageIndex)}
          </div>
          <div class="desk-page-spine" aria-hidden="true"></div>
          <div class="desk-page-leaf leaf-right">
            ${rightPageIndex < totalPages ? getPageHtml(rightPageIndex) : '<div class="empty-leaf-placeholder"></div>'}
          </div>
        </div>
      `;
    } else {
      // SINGLE PAGE MOBILE VIEW
      html = getPageHtml(currentPage);
    }

    // Animate Page Content Turn
    if (!prefersReducedMotion()) {
      gsap.fromTo(
        activePageEl,
        { opacity: 0, x: pageIndex > currentPage ? 15 : -15 },
        { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
    activePageEl.innerHTML = html;

    // Attach Interactive Physical Stamp & Long-Press Handlers
    attachPhysicalStampingHandlers(activePageEl);

    // Reattach Name Input Handler on Page 0
    const nameInp = activePageEl.querySelector('#passport-user-name');
    nameInp?.addEventListener('input', (e) => {
      setUserName(e.target.value);
    });
  }

  function getPageHtml(index) {
    if (index === 0) {
      return `
        <div class="expedition-page-identity">
          <div class="page-guilloche-header">
            <div class="page-category-tag">FILĂ DE IDENTIFICARE</div>
            <div class="page-security-mark">SERIA RC-2026</div>
          </div>

          <h2 class="paper-heading">Jurnalul Călătorului</h2>
          <p class="paper-subheading">Comuna Runcu, Munții Vâlcan • Proiectul Lider European</p>

          <div class="paper-user-card">
            <label for="passport-user-name" class="paper-field-label">EXPLORATOR ÎNREGISTRAT:</label>
            <input 
              type="text" 
              id="passport-user-name" 
              class="paper-name-input" 
              placeholder="Scrie numele tău..." 
              value="${getUserName() || ''}" 
              maxlength="40"
              autocomplete="name"
            />
            <div class="paper-signature-line" aria-hidden="true"></div>
          </div>

          <div class="paper-progress-summary">
            <div class="paper-summary-head">
              <span>Progres Expediție:</span>
              <strong>${unlockedCount} / ${totalCount} Ștampile (${progressPercent}%)</strong>
            </div>

            <div class="cat-ink-rings-row">
              <div class="cat-ink-badge" style="--ink-color: ${THEME_TOKENS.colors.inkA};">
                <span class="cat-ink-icon" aria-hidden="true">${CATEGORY_META.A.iconSvg}</span>
                <span class="cat-ink-name">Obiective</span>
                <span class="cat-ink-count">${catStats.A.unlocked}/${catStats.A.total}</span>
              </div>
              <div class="cat-ink-badge" style="--ink-color: ${THEME_TOKENS.colors.inkB};">
                <span class="cat-ink-icon" aria-hidden="true">${CATEGORY_META.B.iconSvg}</span>
                <span class="cat-ink-name">Tradiții</span>
                <span class="cat-ink-count">${catStats.B.unlocked}/${catStats.B.total}</span>
              </div>
              <div class="cat-ink-badge" style="--ink-color: ${THEME_TOKENS.colors.inkC};">
                <span class="cat-ink-icon" aria-hidden="true">${CATEGORY_META.C.iconSvg}</span>
                <span class="cat-ink-name">Personalități</span>
                <span class="cat-ink-count">${catStats.C.unlocked}/${catStats.C.total}</span>
              </div>
              <div class="cat-ink-badge" style="--ink-color: ${THEME_TOKENS.colors.inkD};">
                <span class="cat-ink-icon" aria-hidden="true">${CATEGORY_META.D.iconSvg}</span>
                <span class="cat-ink-name">Povești</span>
                <span class="cat-ink-count">${catStats.D.unlocked}/${catStats.D.total}</span>
              </div>
            </div>
          </div>

          ${isCompleted ? `
            <div class="paper-certificate-callout">
              <div class="cert-callout-medal" aria-hidden="true">${icon('medal', 28)}</div>
              <div class="cert-callout-text">
                <strong>Expediție Completată cu Succes!</strong>
                <p>Ai adunat toate cele 12 ștampile ale comunei.</p>
              </div>
              <a href="#/certificat" class="btn-sheet-primary" style="padding: 0.6rem 0.95rem; font-size: 0.82rem;">
                ${icon('medal', 14)}
                <span>Vezi Certificatul Oficial</span>
              </a>
            </div>
          ` : `
            <div class="paper-hint-box">
              <p>Răsfoiește paginile pentru a ștampila. Menține apăsat sau apasă lung pe un slot liber pentru a aplica ștampila fizic!</p>
            </div>
          `}

          <!-- Institutional Endorsement Block -->
          <div class="paper-institutional-box" aria-label="Acreditare Instituțională">
            <span class="paper-inst-caption">PROIECT PARTENERIAT EDUCAȚIONAL &amp; PATRIMONIU:</span>
            <div class="paper-crests-row">
              <div class="paper-crest-col" title="Comuna Runcu, Gorj">
                <img src="./assets/logos/stema-comuna-runcu.png" alt="Stema Comunei Runcu" class="paper-crest-img stema" />
                <span class="paper-crest-name">Comuna Runcu</span>
              </div>
              <div class="paper-crest-col" title="Liceul Tehnologic General Constantin Șandru Bâlta Runcu">
                <img src="./assets/logos/logo-liceu-runcu.jpg" alt="Liceul Tehnologic G-ral C-tin Șandru" class="paper-crest-img liceu" />
                <span class="paper-crest-name">Lic. Tehnologic Șandru</span>
              </div>
              <div class="paper-crest-col" title="Concursul Național Lider European 2026">
                <img src="./assets/logos/logo-lider-european.jpg" alt="Lider European 2026" class="paper-crest-img lider" />
                <span class="paper-crest-name">Lider European</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (index === 1) return renderCategoryPage('A', CATEGORY_META.A, catAStamps);
    if (index === 2) return renderCategoryPage('B', CATEGORY_META.B, catBStamps);

    if (index === 3) {
      return `
        <div class="expedition-page-stamps">
          <div class="page-guilloche-header">
            <div class="page-category-tag" style="color: ${THEME_TOKENS.colors.inkC};">
              CATEGORIILE C &amp; D • MEMORIA COMUNITĂȚII
            </div>
            <div class="page-security-mark">${catStats.C.unlocked + catStats.D.unlocked}/${catStats.C.total + catStats.D.total} OBȚINUTE</div>
          </div>

          <h2 class="paper-heading">Personalități &amp; Povești</h2>
          <p class="paper-subheading">Oamenii de seamă și claca de altădată</p>

          <div class="paper-stamps-grid">
            ${catCDStamps.map(stamp => renderStampSlot(stamp)).join('')}
          </div>
        </div>
      `;
    }

    return '';
  }

  function renderCategoryPage(catId, meta, stamps) {
    return `
      <div class="expedition-page-stamps">
        <div class="page-guilloche-header">
          <div class="page-category-tag" style="color: ${meta.color};">
            CATEGORIA ${catId} • ${meta.labelRo.toUpperCase()}
          </div>
          <div class="page-security-mark">${catStats[catId].unlocked}/${catStats[catId].total} OBȚINUTE</div>
        </div>

        <h2 class="paper-heading">${meta.labelRo}</h2>
        <p class="paper-subheading">${meta.descRo}</p>

        <div class="paper-stamps-grid">
          ${stamps.map(stamp => renderStampSlot(stamp)).join('')}
        </div>
      </div>
    `;
  }

  function renderStampSlot(stamp) {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    const stampSize = isDesktop ? 96 : 124;
    const unlocked = isStampUnlocked(stamp.id);
    const unlockInfo = unlocked ? getStampUnlockInfo(stamp.id) : null;
    const stampMarkup = unlocked
      ? generateStampSvg(stamp, unlockInfo, { size: stampSize })
      : generateLockedSlotSvg(stamp, { size: stampSize });

    return `
      <div class="paper-stamp-slot ${unlocked ? 'is-collected' : 'is-empty'}" 
           id="slot-${stamp.id}" 
           data-id="${stamp.id}"
           title="${unlocked ? stamp.title : 'Apasă lung pentru a încărca ștampila cu cerneală'}">
        <a href="#/poveste/${stamp.id}" class="slot-link-wrapper" aria-label="${stamp.title}, ${unlocked ? 'ștampilat' : 'neștampilat'}">
          <div class="slot-stamp-frame">
            ${stampMarkup}
          </div>
          <div class="slot-caption">
            <strong class="slot-title">${stamp.title}</strong>
            <span class="slot-date">
              ${unlocked ? `${icon('check', 12)} ${unlockInfo.dateFormatted}` : (stamp.category === 'A' ? `${icon('key', 12)} Cifru de Teren` : `${icon('idea', 12)} Quiz poveste`)}
            </span>
          </div>
        </a>

        ${!unlocked ? `
          <!-- Physical Long-Press Ink Charging Ring -->
          <div class="stamp-press-charge-zone" data-stamp-id="${stamp.id}" aria-label="Apasă lung pentru a ștampila">
            <svg class="press-charge-svg" viewBox="0 0 36 36" aria-hidden="true">
              <circle class="charge-ring-bg" cx="18" cy="18" r="14" />
              <circle class="charge-ring-fill" id="charge-fill-${stamp.id}" cx="18" cy="18" r="14" />
            </svg>
            <span class="charge-hint-text">Apasă lung</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  // -----------------------------------------------------------
  // Physical Stamping: Long-Press Ink Charging & Ink Impact
  // -----------------------------------------------------------
  function attachPhysicalStampingHandlers(rootEl) {
    rootEl.querySelectorAll('.stamp-press-charge-zone').forEach(zone => {
      const stampId = zone.getAttribute('data-stamp-id');
      const fillRing = zone.querySelector(`#charge-fill-${stampId}`);
      let pressTimer = null;
      let startTime = 0;
      let animFrame = null;
      const CHARGE_DURATION = 700; // ms

      const startCharge = (e) => {
        e.preventDefault();
        e.stopPropagation();
        startTime = Date.now();
        zone.classList.add('is-charging');
        triggerVibration(20);

        const updateRing = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / CHARGE_DURATION, 1);
          const offset = 88 - (88 * progress);
          if (fillRing) fillRing.style.strokeDashoffset = `${offset}`;

          if (progress < 1) {
            animFrame = requestAnimationFrame(updateRing);
          } else {
            // 100% Charged! Trigger Stamp Impact
            cancelCharge();
            executeStampImpact(stampId);
          }
        };
        animFrame = requestAnimationFrame(updateRing);
      };

      const cancelCharge = () => {
        zone.classList.remove('is-charging');
        if (animFrame) cancelAnimationFrame(animFrame);
        if (fillRing) fillRing.style.strokeDashoffset = '88';
      };

      zone.addEventListener('pointerdown', startCharge);
      zone.addEventListener('pointerup', cancelCharge);
      zone.addEventListener('pointerleave', cancelCharge);
      zone.addEventListener('pointercancel', cancelCharge);
    });

    // Cross-linking: Hover on stamp slot highlights marker on map
    rootEl.querySelectorAll('.paper-stamp-slot').forEach(slot => {
      const id = slot.getAttribute('data-id');
      slot.addEventListener('mouseenter', () => {
        window.dispatchEvent(new CustomEvent('highlight-map-waypoint', { detail: { id } }));
      });
      slot.addEventListener('mouseleave', () => {
        window.dispatchEvent(new CustomEvent('highlight-map-waypoint', { detail: { id: null } }));
      });
    });
  }

  function executeStampImpact(stampId) {
    const stamp = stampsData.find(s => s.id === stampId);
    if (!stamp) return;

    unlockStamp(stamp.id, { method: 'physical' });
    playStampSound();
    triggerVibration([60, 40, 80]);

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#E5A93C', '#109D73', '#FFD782']
    });

    // Screen shake
    if (!prefersReducedMotion()) {
      gsap.to(pagesEl, {
        x: '+=5',
        yoyo: true,
        repeat: 3,
        duration: 0.05,
        ease: 'sine.inOut'
      });
    }

    setTimeout(() => {
      renderPassportView(stampsData, container, { initialPage: currentPage });
    }, 450);
  }

  // Cross-linking Listener: Highlight slot when map marker is hovered
  window.addEventListener('highlight-passport-slot', (e) => {
    const targetId = e.detail?.id;
    activePageEl.querySelectorAll('.paper-stamp-slot').forEach(slot => {
      const match = slot.getAttribute('data-id') === targetId;
      slot.classList.toggle('is-desk-highlighted', match);
    });
  });

  // Cover Fold / Unfold
  function toggleCover() {
    playPageFlipSound();
    triggerVibration([30]);
    isCoverOpen = !isCoverOpen;
    if (isCoverOpen) {
      coverEl.classList.remove('is-visible');
      coverEl.classList.add('is-folded');
      pagesEl.classList.remove('is-hidden');
      pagesEl.classList.add('is-active');
      labelToggle.textContent = 'Copertă';
    } else {
      coverEl.classList.remove('is-folded');
      coverEl.classList.add('is-visible');
      pagesEl.classList.remove('is-active');
      pagesEl.classList.add('is-hidden');
      labelToggle.textContent = 'Pagini';
    }
  }

  // Presentation Mode Toggle
  function togglePresentationMode() {
    isPresentationMode = !isPresentationMode;
    document.body.classList.toggle('presentation-mode', isPresentationMode);
    if (presentationExitBar) {
      presentationExitBar.hidden = !isPresentationMode;
    }
    playTapSound();
  }

  // Specular Gold Reflection Effect on Living Cover
  if (foilWrap && foilGlint && !prefersReducedMotion()) {
    foilWrap.addEventListener('pointermove', (e) => {
      const rect = foilWrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      foilGlint.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255, 235, 160, 0.7) 0%, transparent 60%)`;
      foilWrap.style.transform = `perspective(600px) rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 12}deg)`;
    });

    foilWrap.addEventListener('pointerleave', () => {
      foilWrap.style.transform = 'none';
      foilGlint.style.background = 'radial-gradient(circle at 45% 40%, rgba(255, 235, 160, 0.45) 0%, transparent 65%)';
    });
  }

  // Keyboard Navigation & Shortcuts
  const handleKeyNav = (e) => {
    if (e.key === 'ArrowRight') renderPage(currentPage + 1);
    if (e.key === 'ArrowLeft') renderPage(currentPage - 1);
    if (e.key === 'm' || e.key === 'M') window.location.hash = '#/';
    if (e.key === 'p' || e.key === 'P') togglePresentationMode();
    if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
    if (e.key === 'Escape') {
      if (isPresentationMode) togglePresentationMode();
      else if (!isCoverOpen) toggleCover();
    }
  };
  window.addEventListener('keydown', handleKeyNav);

  // Event Listeners
  prevBtn.addEventListener('click', () => renderPage(currentPage - 1));
  nextBtn.addEventListener('click', () => renderPage(currentPage + 1));
  toggleCoverBtn?.addEventListener('click', toggleCover);
  openBookletBtn?.addEventListener('click', toggleCover);
  presentationBtn?.addEventListener('click', togglePresentationMode);
  presentationExitBtn?.addEventListener('click', togglePresentationMode);

  fullscreenBtn?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Mobile Swipe Gestures
  let touchStartX = 0;
  pagesEl.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  pagesEl.addEventListener('touchend', (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX < -50) {
      renderPage(currentPage + 1);
    } else if (deltaX > 50) {
      renderPage(currentPage - 1);
    }
  }, { passive: true });

  // Reset confirmation
  const resetBtn = container.querySelector('#btn-reset-passport');
  resetBtn?.addEventListener('click', () => {
    const confirmed = window.confirm(
      'Sigur dorești să resetezi pașaportul? Toate ștampilele colectate pe acest telefon vor fi șterse.'
    );
    if (confirmed) {
      resetPassport();
      renderPassportView(stampsData, container);
    }
  });

  // Initial Page Render
  renderPage(0, true);
}
