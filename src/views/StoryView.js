/**
 * Immersive Full-Screen Stories View (#/poveste/<id>)
 * Instagram/TikTok stories format: segmented progress bars, Ken Burns zoom,
 * tap & swipe navigation, expandable "Știai că?", Audio player with transcript,
 * Photo Gallery lightbox with captions & credits, and Quiz Stamping for Categories B-D.
 */

import { gsap } from 'gsap';
import confetti from 'canvas-confetti';
import { CATEGORY_META, prefersReducedMotion } from '../tokens.js';
import { isStampUnlocked, getStampUnlockInfo, unlockStamp } from '../services/storage.js';
import { generateStampSvg } from '../components/StampSvg.js';
import { triggerVibration, playStampSound, playTapSound } from '../utils/audioHaptics.js';
import { icon } from '../components/icons.js';
import { picture } from '../utils/img.js';

export async function renderStoryView(storyId, storiesData, container) {
  const story = storiesData.find(s => s.id === storyId);

  if (!story) {
    container.innerHTML = `
      <div class="unlock-view">
        <h1 class="unlock-title">Povestea nu a fost găsită</h1>
        <p class="hero-lead">Obiectivul selectat nu este disponibil în colecție.</p>
        <a href="#/" class="btn-primary-action">Înapoi la hartă</a>
      </div>
    `;
    return;
  }

  // Consent enforcement: if category C/D and consent is false, do not display
  if (['C', 'D'].includes(story.category) && story.consent === false) {
    container.innerHTML = `
      <div class="unlock-view">
        <h1 class="unlock-title">Conținut restricționat</h1>
        <p class="hero-lead">Această poveste nu are consimțământul de publicare confirmat conform politicilor de confidențialitate.</p>
        <a href="#/" class="btn-primary-action">Înapoi la hartă</a>
      </div>
    `;
    return;
  }

  const cat = CATEGORY_META[story.category] || CATEGORY_META.A;
  const slides = story.slides || [];
  const totalSlides = slides.length + 1; // +1 for the final action/quiz slide
  let currentSlide = 0;
  let isPaused = false;
  let slideTimer = null;
  const SLIDE_DURATION = 6500; // ms

  container.innerHTML = `
    <div class="story-viewer-wrap" id="story-viewer" style="--cat-color: ${cat.color};">
      <!-- Top Progress Bars -->
      <div class="story-bars-row" id="story-bars-row" aria-hidden="true">
        ${Array.from({ length: totalSlides }).map((_, i) => `
          <div class="story-bar-track">
            <div class="story-bar-fill" id="bar-fill-${i}"></div>
          </div>
        `).join('')}
      </div>

      <!-- Top Story Header Bar -->
      <header class="story-header-bar">
        <div class="story-header-left">
          <div class="story-cat-pill">
            ${cat.iconSvg}
            <span>${cat.labelRo}</span>
          </div>
          <span class="story-header-title">${story.title}</span>
        </div>

        <div class="story-header-actions">
          ${story.gallery && story.gallery.length > 1 ? `
            <button type="button" class="btn-story-hdr" id="btn-open-gallery" title="Vezi galeria foto (${story.gallery.length} imagini)" aria-label="Galeria foto">
              ${icon('image', 18)}
              <span class="gallery-count-badge">${story.gallery.length}</span>
            </button>
          ` : ''}

          ${story.audio ? `
            <button type="button" class="btn-story-hdr" id="btn-toggle-audio" title="Ascultă narațiunea audio" aria-label="Narațiune audio">
              ${icon('audio', 18)}
            </button>
          ` : ''}

          <button type="button" class="btn-story-close" id="btn-close-story" aria-label="Închide povestea">
            ${icon('close', 18)}
          </button>
        </div>
      </header>

      <!-- Slides Container -->
      <main class="story-stage" id="story-stage" role="region" aria-live="polite">
        <!-- Rendered dynamically -->
      </main>

      <!-- Tap Zones for Navigation -->
      <div class="story-tap-zone zone-left" id="zone-prev" aria-label="Slide precedent"></div>
      <div class="story-tap-zone zone-right" id="zone-next" aria-label="Slide următor"></div>

      <!-- Gallery Modal Lightbox -->
      <div class="story-gallery-modal" id="story-gallery-modal" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Galerie foto">
        <div class="gallery-modal-content">
          <div class="gallery-modal-header">
            <h3>Galeria Locului (${story.gallery?.length || 0} fotografii)</h3>
            <button type="button" class="btn-story-close" id="btn-close-gallery" aria-label="Închide galeria">
              ${icon('close', 18)}
            </button>
          </div>
          <div class="gallery-carousel-list">
            ${(story.gallery || []).map((img, idx) => `
              <figure class="gallery-fig">
                ${picture(img.photoMeta, {
                  alt: img.alt || `${story.title} - imagine ${idx + 1}`,
                  className: 'gallery-fig-img',
                  sizes: '(max-width: 600px) 100vw, 840px',
                  fallbackSrc: img.src
                })}
                <figcaption class="gallery-figcaption">
                  <p class="gallery-caption-text">${img.caption || ''}</p>
                  <p class="gallery-credit-text">Credit: ${img.credit || 'Arhiva Comuna Runcu'}</p>
                </figcaption>
              </figure>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Audio Drawer (if audio available) -->
      ${story.audio ? `
        <div class="story-audio-drawer" id="story-audio-drawer" aria-label="Player audio">
          <div class="audio-drawer-handle" aria-hidden="true"></div>
          <div class="audio-drawer-body">
            <audio id="story-audio-elem" src="${story.audio}" preload="metadata"></audio>
            <div class="audio-ctrl-row">
              <button type="button" class="btn-audio-play" id="btn-audio-play-toggle" aria-label="Redă sau pune pauză">
                ${icon('play', 16)}
              </button>
              <div class="audio-time-bar">
                <div class="audio-progress" id="audio-progress-bar"></div>
              </div>
              <span class="audio-time-label" id="audio-time-label">0:00</span>
            </div>
            ${story.audioTranscript ? `
              <div class="audio-transcript-box">
                <h4>Transcriere:</h4>
                <p>${story.audioTranscript}</p>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  const stage = container.querySelector('#story-stage');
  const closeBtn = container.querySelector('#btn-close-story');
  const prevZone = container.querySelector('#zone-prev');
  const nextZone = container.querySelector('#zone-next');
  const galleryModal = container.querySelector('#story-gallery-modal');
  const openGalleryBtn = container.querySelector('#btn-open-gallery');
  const closeGalleryBtn = container.querySelector('#btn-close-gallery');

  // Render Slide Content
  function showSlide(index) {
    currentSlide = Math.max(0, Math.min(totalSlides - 1, index));
    updateBars();

    // Check if it's the final slide (Action & Quiz)
    if (currentSlide === totalSlides - 1) {
      renderFinalSlide();
      return;
    }

    const slide = slides[currentSlide];
    const isKenBurns = !prefersReducedMotion();

    stage.innerHTML = `
      <div class="story-slide-view">
        <div class="story-media-layer">
          ${picture(slide.photoMeta, {
            alt: slide.alt || story.title,
            className: `story-media-img ${isKenBurns ? 'ken-burns-active' : ''}`,
            sizes: '100vw',
            eager: currentSlide === 0,
            fallbackSrc: slide.photo
          })}
          <div class="story-scrim-top" aria-hidden="true"></div>
          <div class="story-scrim-bottom" aria-hidden="true"></div>
        </div>

        <div class="story-content-layer">
          ${slide.didYouKnow ? `
            <div class="story-fact-pill" id="fact-pill">
              <div class="fact-pill-header">
                <span class="fact-pill-icon" aria-hidden="true">${icon('idea', 16)}</span>
                <strong>Știai că?</strong>
              </div>
              <p class="fact-pill-text">${slide.didYouKnow}</p>
            </div>
          ` : ''}

          <div class="story-narrative-card">
            <p class="story-narrative-text">${slide.text}</p>
            ${slide.caption ? `
              <p class="story-photo-caption">${slide.caption}</p>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    // Slide in content smoothly
    if (!prefersReducedMotion()) {
      gsap.fromTo(
        stage.querySelector('.story-content-layer'),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
      );
    }
  }

  // Render Final Slide: Sources, Map Link & Quiz
  function renderFinalSlide() {
    const isUnlocked = isStampUnlocked(story.id);
    const unlockInfo = isUnlocked ? getStampUnlockInfo(story.id) : null;
    const isPhysical = story.category === 'A';
    const [lng, lat] = story.coordinates;
    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    stage.innerHTML = `
      <div class="story-slide-view story-final-slide">
        <div class="story-final-card">
          <div class="story-cat-pill" style="margin-bottom: 0.5rem;">
            ${cat.iconSvg}
            <span>${cat.labelRo}</span>
          </div>

          <h2 class="story-final-title">${story.title}</h2>
          <p class="story-final-sub">Ai parcurs povestea completă a acestui obiectiv din Runcu.</p>

          <!-- Stamp Status or Quiz -->
          <div class="story-stamp-reward-box" id="reward-box">
            ${isUnlocked ? `
              <div class="reward-unlocked-state">
                <div class="reward-stamp-preview">
                  ${generateStampSvg(story, unlockInfo, { size: 130 })}
                </div>
                <div class="reward-status-text">
                  <span class="badge-done">${icon('check', 14)} Ștampilă Colectată</span>
                  <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                    Obținută pe ${unlockInfo.dateFormatted}
                  </p>
                </div>
              </div>
            ` : (isPhysical ? `
              <!-- Physical Category A: Expedition Cipher & Reticle -->
              <div class="reward-qr-prompt">
                <div style="margin-bottom: 0.4rem; color: var(--accent-brand);">${icon('pin', 32)}</div>
                <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.35rem;">Loc fizic de explorat</h3>
                <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45; margin-bottom: 1rem;">
                  Pentru a primi această ștampilă în pașaport, mergi la obiectiv și deschide cifrul de teren din alamă sau lentila optică.
                </p>
                <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
                  <a href="${navUrl}" target="_blank" rel="noopener noreferrer" class="btn-sheet-primary" style="font-size: 0.82rem;">
                    ${icon('navigate', 14)}
                    <span>Navighează către loc</span>
                  </a>
                  <button type="button" class="btn-sheet-secondary" id="btn-manual-code-from-story" style="font-size: 0.82rem;">
                    ${icon('key', 14)}
                    <span>Cifru &amp; Lentilă</span>
                  </button>
                </div>
              </div>
            ` : `
              <!-- Categories B, C, D: Interactive Quiz for Stamp -->
              <div class="story-quiz-container" id="quiz-container">
                <div class="quiz-badge">Răspunde pentru a primi ștampila</div>
                <h3 class="quiz-question">${story.quiz?.question || 'Ce ai reținut din această poveste?'}</h3>

                <div class="quiz-options-list">
                  ${(story.quiz?.options || []).map((opt, optIdx) => `
                    <button type="button" class="btn-quiz-option" data-index="${optIdx}">
                      <span class="quiz-opt-letter">${String.fromCharCode(65 + optIdx)}</span>
                      <span class="quiz-opt-text">${opt}</span>
                    </button>
                  `).join('')}
                </div>
                <div class="quiz-feedback-msg" id="quiz-feedback" role="alert"></div>
              </div>
            `)}
          </div>

          <!-- Sources Box -->
          <div class="story-sources-card">
            <h4 class="sources-heading">Surse &amp; Documentație:</h4>
            <ul class="sources-list">
              ${(story.sources || []).map(src => `
                <li>
                  <a href="${src.url}" target="_blank" rel="noopener noreferrer">
                    <span>${src.title}</span>
                    ${icon('chevronRight', 12)}
                  </a>
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="story-final-actions">
            <a href="#/pasaport" class="btn-primary-action" style="width: 100%;">
              ${icon('book', 16)}
              <span>Vezi Pașaportul &amp; Ștampilele</span>
            </a>
            <a href="#/" class="btn-secondary-action" style="width: 100%;">
              ${icon('map', 16)}
              <span>Înapoi la Mini-Hartă</span>
            </a>
          </div>
        </div>
      </div>
    `;

    // Quiz Option Handling
    if (!isUnlocked && !isPhysical && story.quiz) {
      const quizOpts = stage.querySelectorAll('.btn-quiz-option');
      const feedback = stage.querySelector('#quiz-feedback');

      quizOpts.forEach(btn => {
        btn.addEventListener('click', () => {
          const selectedIdx = parseInt(btn.getAttribute('data-index'), 10);
          if (selectedIdx === story.quiz.answerIndex) {
            // Correct Answer!
            btn.classList.add('is-correct');
            feedback.innerHTML = `<span style="color: #34d399;">${icon('check', 14)} Răspuns corect! Ștampila a fost adăugată în pașaport.</span>`;

            // Unlock Stamp
            unlockStamp(story.id, { method: 'quiz' });

            triggerVibration([60, 40, 80]);
            playStampSound();
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.5 },
              colors: [cat.color, '#E5A93C', '#FFFFFF']
            });

            // Transition to unlocked view
            setTimeout(() => {
              renderFinalSlide();
            }, 1200);
          } else {
            // Wrong Answer
            btn.classList.add('is-wrong');
            feedback.innerHTML = `<span style="color: #f87171;">Mai încearcă o dată! Revede povestea dacă este nevoie.</span>`;
            setTimeout(() => btn.classList.remove('is-wrong'), 800);
          }
        });
      });
    }

    // Manual code / cryptex button
    stage.querySelector('#btn-manual-code-from-story')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-code-modal', {
        detail: { tab: 'cifru', stampId: story.id }
      }));
    });
  }

  // Update Segmented Progress Bars
  function updateBars() {
    for (let i = 0; i < totalSlides; i++) {
      const fill = container.querySelector(`#bar-fill-${i}`);
      if (!fill) continue;

      if (i < currentSlide) {
        fill.style.width = '100%';
        fill.style.transition = 'none';
      } else if (i === currentSlide) {
        fill.style.width = '100%';
        fill.style.transition = prefersReducedMotion() ? 'none' : `width ${SLIDE_DURATION}ms linear`;
      } else {
        fill.style.width = '0%';
        fill.style.transition = 'none';
      }
    }

    startAutoAdvance();
  }

  // Auto-advance Timer
  function startAutoAdvance() {
    clearTimeout(slideTimer);
    if (currentSlide === totalSlides - 1 || isPaused) return;

    slideTimer = setTimeout(() => {
      if (!isPaused && currentSlide < totalSlides - 1) {
        showSlide(currentSlide + 1);
      }
    }, SLIDE_DURATION);
  }

  // Navigation: Next / Prev
  function nextSlide() {
    if (currentSlide < totalSlides - 1) {
      playTapSound();
      showSlide(currentSlide + 1);
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      playTapSound();
      showSlide(currentSlide - 1);
    }
  }

  // Event Listeners for Tap Zones
  prevZone.addEventListener('click', (e) => {
    e.stopPropagation();
    prevSlide();
  });

  nextZone.addEventListener('click', (e) => {
    e.stopPropagation();
    nextSlide();
  });

  // Long press / Touch hold to pause
  const viewer = container.querySelector('#story-viewer');
  viewer.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
  viewer.addEventListener('touchend', () => { isPaused = false; startAutoAdvance(); }, { passive: true });
  viewer.addEventListener('mousedown', () => { isPaused = true; });
  viewer.addEventListener('mouseup', () => { isPaused = false; startAutoAdvance(); });

  // Keyboard navigation
  function handleKeyDown(e) {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'Escape') {
      window.location.hash = '#/';
    }
  }
  window.addEventListener('keydown', handleKeyDown);

  // Close Story
  closeBtn.addEventListener('click', () => {
    clearTimeout(slideTimer);
    window.removeEventListener('keydown', handleKeyDown);
    window.location.hash = '#/';
  });

  // Gallery Modal Lightbox Toggle
  openGalleryBtn?.addEventListener('click', () => {
    isPaused = true;
    galleryModal.classList.add('is-open');
    galleryModal.setAttribute('aria-hidden', 'false');
  });

  closeGalleryBtn?.addEventListener('click', () => {
    galleryModal.classList.remove('is-open');
    galleryModal.setAttribute('aria-hidden', 'true');
    isPaused = false;
    startAutoAdvance();
  });

  // Audio Drawer Toggle & Controls (if present)
  if (story.audio) {
    const audioDrawer = container.querySelector('#story-audio-drawer');
    const toggleAudioBtn = container.querySelector('#btn-toggle-audio');
    const audioEl = container.querySelector('#story-audio-elem');
    const playBtn = container.querySelector('#btn-audio-play-toggle');
    const timeLabel = container.querySelector('#audio-time-label');
    const progressBar = container.querySelector('#audio-progress-bar');

    toggleAudioBtn?.addEventListener('click', () => {
      audioDrawer.classList.toggle('is-open');
    });

    playBtn?.addEventListener('click', () => {
      if (!audioEl) return;
      if (audioEl.paused) {
        audioEl.play().catch(() => {});
        playBtn.innerHTML = icon('pause', 16);
      } else {
        audioEl.pause();
        playBtn.innerHTML = icon('play', 16);
      }
    });

    audioEl?.addEventListener('timeupdate', () => {
      const cur = audioEl.currentTime;
      const dur = audioEl.duration || 1;
      const pct = (cur / dur) * 100;
      if (progressBar) progressBar.style.width = `${pct}%`;
      const mins = Math.floor(cur / 60);
      const secs = Math.floor(cur % 60).toString().padStart(2, '0');
      if (timeLabel) timeLabel.textContent = `${mins}:${secs}`;
    });

    audioEl?.addEventListener('ended', () => {
      if (playBtn) playBtn.innerHTML = icon('play', 16);
      if (progressBar) progressBar.style.width = '0%';
    });
  }

  // Initial Slide Display
  showSlide(0);
}
