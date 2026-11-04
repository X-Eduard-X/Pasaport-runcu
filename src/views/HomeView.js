/**
 * Home View — Landing, Interactive SVG Mini-Map, 3 Steps Guide, Progress & Points List
 * Part of "Pașaportul Comunei Runcu" — Expedition Journal Style
 */

import { gsap } from 'gsap';
import { APP_CONFIG } from '../config.js';
import { CATEGORY_META, prefersReducedMotion } from '../tokens.js';
import { RUNCU_BOUNDARY_PATH } from '../data/boundary.js';
import { createMiniMap } from '../components/MiniMap.js';
import { getPassportData, isStampUnlocked, isDemoMode, resetPassport } from '../services/storage.js';
import { icon } from '../components/icons.js';
import { picture } from '../utils/img.js';
import { playTapSound } from '../utils/audioHaptics.js';

export function renderHomeView(stampsData, container) {
  const passport = getPassportData();
  const unlockedCount = Object.keys(passport.unlocked || {}).length;
  const totalCount = stampsData.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);
  const isDemo = isDemoMode();

  container.innerHTML = `
    <!-- Top Brand Header -->
    <header class="app-header">
      <div class="app-brand">
        <img src="./assets/logos/stema-comuna-runcu.png" alt="Stema Comunei Runcu" class="brand-crest-stema" width="28" height="44" />
        <div class="brand-text-col">
          <span class="brand-title">Pașaportul Comunei Runcu</span>
          <span class="brand-subtitle">Lider European 2026</span>
        </div>
      </div>
      <div class="header-actions">
        <button type="button" class="btn-header-code" id="btn-open-intro-hdr" title="Ghid &amp; Prezentare" aria-label="Ghid: Prezentare introductivă">
          ${icon('idea', 16)}
          <span>Ghid</span>
        </button>
        <button type="button" class="btn-header-code" id="btn-open-code-modal" title="Mecanismul de ștampilare și cifru" aria-label="Mecanismul de ștampilare: Cifru și scanner">
          ${icon('key', 16)}
          <span>Ștampilează</span>
        </button>
        <a href="#/pasaport" class="passport-pill-counter" title="Vezi pașaportul" aria-label="${unlockedCount}/${totalCount} ștampile colectate, vezi pașaportul">
          <span>${unlockedCount}/${totalCount}</span>
          ${icon('chevronRight', 14)}
        </a>
      </div>
    </header>

    ${isDemo ? `
      <aside class="demo-banner" aria-label="Banner mod demo">
        <div class="demo-banner__left">
          <span class="demo-tag">MOD DEMO</span>
          <span>Poți debloca ștampilele direct pentru testare</span>
        </div>
        <button type="button" class="demo-btn-reset" id="demo-reset-btn" aria-label="Resetează pașaportul">Reset</button>
      </aside>
    ` : ''}

    <main>
      <!-- Hero / Emblema Comunei Runcu -->
      <section class="hero-emblem-wrap" style="padding-bottom: 0.75rem;">
        <div class="eu-lead-badge">
          <span>Proiectul Lider European 2026</span>
        </div>
        <h1 class="hero-title" style="font-size: 2.1rem;">Explorează Poveștile Runcului</h1>
        <p class="hero-lead">
          Descoperă patrimoniul natural, tradițiile și memoria vie a comunei. Atinge orice punct de pe hartă pentru a-i deschide povestea și a-i câștiga ștampila.
        </p>

        <!-- Institutional Partners Bar -->
        <div class="institutional-strip" aria-label="Parteneri Instituționali">
          <div class="inst-item" title="Comuna Runcu, Județul Gorj">
            <img src="./assets/logos/stema-comuna-runcu.png" alt="Stema Comunei Runcu" class="inst-logo-shield" width="34" height="54" />
            <div class="inst-info">
              <span class="inst-label">PATRIMONIU LOCAL</span>
              <strong class="inst-title">Comuna Runcu</strong>
              <span class="inst-sub">Județul Gorj</span>
            </div>
          </div>

          <div class="inst-separator" aria-hidden="true"></div>

          <div class="inst-item" title="Liceul Tehnologic „G-ral C-tin Șandru” Bâlta - Runcu">
            <img src="./assets/logos/logo-liceu-runcu.jpg" alt="Liceul Tehnologic G-ral C-tin Șandru" class="inst-logo-round" width="46" height="46" />
            <div class="inst-info">
              <span class="inst-label">INIȚIATIVĂ EDUCAȚIONALĂ</span>
              <strong class="inst-title">Liceul Tehnologic</strong>
              <span class="inst-sub">„G-ral C-tin Șandru”</span>
            </div>
          </div>

          <div class="inst-separator" aria-hidden="true"></div>

          <div class="inst-item" title="Concursul Național Lider European 2026">
            <img src="./assets/logos/logo-lider-european.jpg" alt="Lider European 2026" class="inst-logo-rect" width="36" height="46" />
            <div class="inst-info">
              <span class="inst-label">COMPETIȚIE NAȚIONALĂ</span>
              <strong class="inst-title">Lider European</strong>
              <span class="inst-sub">Ediția 2026</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 1. Interactive SVG Mini-Map Section -->
      <section class="mini-map-section" aria-label="Harta interactivă a punctelor">
        <div id="mini-map-mount-root"></div>
      </section>

      <!-- Progress Banner -->
      <section class="progress-banner-card" aria-label="Progresul colecției">
        <div class="progress-banner-head">
          <span class="progress-banner-title">Progresul colecției tale</span>
          <span class="progress-banner-count">${unlockedCount} din ${totalCount} obținute (${progressPercent}%)</span>
        </div>
        <div class="progress-track" role="progressbar" aria-label="Progresul colecției de ștampile" aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        <div class="progress-banner-btn-row">
          <a href="#/pasaport" class="btn-passport-cta">
            ${icon('book', 18)}
            <span>Deschide Pașaportul &amp; Ștampilele</span>
          </a>
        </div>
      </section>

      <!-- Cum Funcționează (3 Steps) -->
      <section class="how-it-works-section" aria-label="Instrucțiuni de utilizare">
        <h2 class="section-label">Cum funcționează</h2>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number" aria-hidden="true">1</div>
            <div class="step-icon-wrap" aria-hidden="true">${icon('map', 24)}</div>
            <h3 class="step-title">Explorează</h3>
            <p class="step-desc">Atinge punctele de pe mini-hartă sau mergi la obiective pe teren.</p>
          </div>

          <div class="step-card">
            <div class="step-number" aria-hidden="true">2</div>
            <div class="step-icon-wrap" aria-hidden="true">${icon('book', 24)}</div>
            <h3 class="step-title">Vezi povestea</h3>
            <p class="step-desc">Descoperă fotografiile și istoricul în format interactiv.</p>
          </div>

          <div class="step-card">
            <div class="step-number" aria-hidden="true">3</div>
            <div class="step-icon-wrap" aria-hidden="true">${icon('key', 24)}</div>
            <h3 class="step-title">Colecționează</h3>
            <p class="step-desc">Descifrează cifrul sau lentila (A), sau răspunde la quiz (B–D) pentru ștampilă.</p>
          </div>
        </div>
      </section>

      <!-- Points with Stories List -->
      <section class="points-section" aria-label="Lista obiectivelor">
        <h2 class="section-label">Toate cele 12 locuri și povești din Runcu</h2>
        <div class="points-list">
          ${stampsData.map(stamp => {
            const cat = CATEGORY_META[stamp.category] || CATEGORY_META.A;
            const isUnlocked = isStampUnlocked(stamp.id);
            const [lng, lat] = stamp.coordinates;
            const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

            return `
              <article class="point-card" id="card-${stamp.id}">
                <div class="point-card__header-img">
                  ${picture(stamp.photoMeta, {
                    alt: stamp.photoMeta?.alt || stamp.title,
                    className: 'point-card__img',
                    sizes: '(max-width: 600px) 100vw, 480px',
                    fallbackSrc: stamp.photo
                  })}
                  <div class="point-card__cat-badge" style="--cat-color: ${cat.color}">
                    ${cat.iconSvg}
                    <span>${cat.labelRo}</span>
                  </div>
                  <div class="point-card__status-tag ${isUnlocked ? 'is-unlocked' : 'is-locked'}">
                    ${isUnlocked ? `${icon('check', 13)} Ștampilat` : (stamp.category === 'A' ? `${icon('key', 13)} Cifru de Teren` : `${icon('idea', 13)} Quiz poveste`)}
                  </div>
                </div>

                <div class="point-card__body">
                  <h3 class="point-card__title">${stamp.title}</h3>
                  <p class="point-card__desc">${stamp.shortDescription}</p>

                  <div class="point-card__actions">
                    <a href="#/poveste/${stamp.id}" class="btn-sheet-primary" style="flex: 2;">
                      ${icon('play', 15)}
                      <span>Deschide Povestea</span>
                    </a>

                    ${stamp.category === 'A' ? `
                      <a href="${navUrl}" target="_blank" rel="noopener noreferrer" class="btn-nav-point" title="Navighează către acest loc" aria-label="Navighează către ${stamp.title}">
                        ${icon('navigate', 15)}
                        <span>Navighează</span>
                      </a>
                    ` : ''}
                  </div>

                  ${isDemo ? `
                    <div style="margin-top: 0.6rem; text-align: center;">
                      <button type="button" class="demo-unlock-btn btn-secondary-action" data-stamp-id="${stamp.id}" style="width: 100%; font-size: 0.78rem; padding: 0.5rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;">
                        ${icon('bolt', 14)}
                        <span>Deblochează direct (Demo: ${stamp.code})</span>
                      </button>
                    </div>
                  ` : ''}
                </div>
              </article>
            `;
          }).join('')}
        </div>
      </section>

      <!-- Festivalul Internațional de Umor și Caricatură „Ion Cănăvoiu” Section -->
      <section class="festival-canavoiu-section" id="festivalul-ion-canavoiu" aria-label="Festivalul Internațional de Umor Ion Cănăvoiu">
        <div class="festival-container">
          <div class="festival-header">
            <div class="festival-badge">
              <span class="festival-badge-icon" aria-hidden="true">🎭</span>
              <span>EVENIMENT CULTURAL DE PRESTIGIU • EDIȚIA XXXIII</span>
            </div>
            <h2 class="festival-title">Festivalul Internațional de Umor și Caricatură „Ion Cănăvoiu”</h2>
            <p class="festival-subtitle">
              Sărbătoarea spiritului gorjenesc, a satirei rafinate și a caricaturii în aer liber, desfășurată anual la Runcu și Târgu Jiu
            </p>
          </div>

          <div class="festival-story-card">
            <div class="festival-story-content">
              <div class="festival-text-block">
                <h3 class="festival-h3">Cine a fost Ion Cănăvoiu și ce înseamnă festivalul pentru Runcu?</h3>
                <p class="festival-p">
                  Născut în comuna Runcu pe <strong>8 septembrie 1939</strong>, <strong>Ion Cănăvoiu</strong> a fost una dintre cele mai vii conștiințe satirice ale Gorjului — poet plin de sensibilitate, prozator, gazetar și epigramist cu un condei sclipitor. A creat, redactat și difuzat legendara revistă umoristică <strong>„HAZ-ul”</strong>, lăsând posterității volume antologice precum <em>„Soare cu dinți”</em> (fabule) și <em>„Cobra regală”</em> (epigrame).
                </p>
                <p class="festival-p">
                  În fiecare toamnă, memoria sa este cinstită de <strong>Centrul Județean pentru Conservarea și Promovarea Culturii Tradiționale (CJCPCT) Gorj</strong> și <strong>Consiliul Județean Gorj</strong>, în parteneriat cu <strong>Primăria și Consiliul Local Runcu</strong>, Uniunea Epigramiștilor din România și Teatrul Dramatic „Elvira Godeanu”, prin <strong>Festivalul Internațional de Umor și Caricatură „Ion Cănăvoiu”</strong> (ajuns la Ediția a XXXIII-a).
                </p>
                <p class="festival-p">
                  Peste 130 de creatori se întrec la secțiunile de epigramă, fabulă, parodie și volum. La Runcu, festivalul are un farmec irezistibil: <strong>ateliere deschise de grafică și caricatură în aer liber</strong>, unde maeștri celebri precum <strong>Marian Avramescu</strong> desenează pe loc portrete cu zâmbet pentru localnici, turiști și jandarmii montani care ocrotesc Cheile Sohodolului.
                </p>

                <div class="festival-actions-row">
                  <a href="#/poveste/c-personalitate-locala" class="btn-festival-primary">
                    ${icon('play', 16)}
                    <span>Deschide Povestea &amp; Quiz-ul</span>
                  </a>
                  <button type="button" class="btn-festival-secondary" id="btn-jump-map-festival">
                    ${icon('pin', 16)}
                    <span>Localizează pe Hartă</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- The 3 User-Provided Photos in Exact Order -->
          <div class="festival-gallery-block">
            <h3 class="festival-gallery-heading">Momente și Simboluri ale Festivalului (în ordinea oficială)</h3>
            <p class="festival-gallery-sub">Afișul ediției, portretul marelui epigramist și viața festivalului la Runcu</p>
            
            <div class="festival-photos-grid">
              <!-- Foto 1: Afișul -->
              <figure class="festival-card">
                <div class="festival-card-img-wrap">
                  <img src="./assets/canavoiu/1-afis-festival-canavoiu.jpg" alt="Afișul Festivalului Internațional de Umor Ion Cănăvoiu Ediția XXXIII" class="festival-card-img" loading="lazy" />
                  <span class="festival-order-tag">1 • Afișul Oficial</span>
                </div>
                <figcaption class="festival-card-caption">
                  <span class="festival-pill">EDIȚIA XXXIII • CJCPCT GORJ</span>
                  <h4 class="festival-card-title">Afișul Festivalului Internațional „Ion Cănăvoiu”</h4>
                  <p class="festival-card-text">
                    Afișul oficial al festivalului, ilustrat cu celebra caricatură a scriitorului Ion Cănăvoiu fumând din pipă — un simbol al hazului înțelept și al libertății de creație.
                  </p>
                </figcaption>
              </figure>

              <!-- Foto 2: Portretul de arhivă -->
              <figure class="festival-card">
                <div class="festival-card-img-wrap">
                  <img src="./assets/canavoiu/2-portret-ion-canavoiu.jpg" alt="Portretul scriitorului Ion Cănăvoiu născut în Runcu" class="festival-card-img" loading="lazy" />
                  <span class="festival-order-tag">2 • Scriitorul</span>
                </div>
                <figcaption class="festival-card-caption">
                  <span class="festival-pill">PORTRET DE ARHIVĂ (1939–1992)</span>
                  <h4 class="festival-card-title">Ion Cănăvoiu — Fiu al Runcului</h4>
                  <p class="festival-card-text">
                    Portret de epocă al marelui epigramist, poet și gazetar gorjean născut în vatra satului Runcu, întemeietorul și animatorul revistei satirice „HAZ-ul”.
                  </p>
                </figcaption>
              </figure>

              <!-- Foto 3: Atelierul din Runcu -->
              <figure class="festival-card">
                <div class="festival-card-img-wrap">
                  <img src="./assets/canavoiu/3-atelier-caricaturi-runcu.jpg" alt="Atelier de caricatură în aer liber la Runcu — Maestrul Marian Avramescu oferind caricatura unui jandarm montan" class="festival-card-img" loading="lazy" />
                  <span class="festival-order-tag">3 • Atelier în Runcu</span>
                </div>
                <figcaption class="festival-card-caption">
                  <span class="festival-pill">ATELIER ÎN DIRECT • RUNCU</span>
                  <h4 class="festival-card-title">Caricatură pentru Jandarmeria Montană</h4>
                  <p class="festival-card-text">
                    Maestrul Marian Avramescu îi înmânează cu zâmbet caricatura realizată în direct unui jandarm montan, în timpul atelierelor în aer liber organizate la Runcu.
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="app-institutional-footer">
      <div class="footer-institutional-crests">
        <img src="./assets/logos/stema-comuna-runcu.png" alt="Stema Comunei Runcu" class="footer-logo-stema" width="36" height="57" />
        <img src="./assets/logos/logo-liceu-runcu.jpg" alt="Liceul Tehnologic General Constantin Șandru Bâlta Runcu" class="footer-logo-round" width="48" height="48" />
        <img src="./assets/logos/logo-lider-european.jpg" alt="Lider European 2026" class="footer-logo-rect" width="38" height="48" />
      </div>
      <p class="footer-institutional-text">
        <strong>Pașaportul Comunei Runcu</strong> • Inițiativă educațională și de promovare a patrimoniului cultural și natural dezvoltată de <strong>Liceul Tehnologic „G-ral C-tin Șandru” Bâlta - Runcu</strong> în parteneriat cu <strong>Comuna Runcu</strong>, în cadrul Competiției Naționale <strong>Lider European 2026</strong>.
      </p>
      <p class="footer-privacy-text">
        Toate ștampilele și datele de progres sunt salvate exclusiv local pe dispozitivul tău. Aplicația funcționează complet offline pe traseu.
      </p>
      <div class="footer-actions-row">
        <a href="${APP_CONFIG.MAP_URL}" target="_blank" rel="noopener noreferrer" class="footer-link-external">
          ${icon('mapPin', 14)}
          <span>Harta Interactivă 3D Completă</span>
        </a>
        <button type="button" id="btn-reopen-intro" class="footer-btn-intro">
          ${icon('sparkles', 14)}
          <span>Revede Prezentarea Introductivă</span>
        </button>
      </div>
    </footer>
  `;

  // Mount Interactive Mini-Map
  const mapMountRoot = container.querySelector('#mini-map-mount-root');
  if (mapMountRoot) {
    createMiniMap(mapMountRoot, stampsData);
  }

  // Staggered Cascade Entrance Animation
  if (!prefersReducedMotion()) {
    requestAnimationFrame(() => {
      const hero = container.querySelector('.hero-emblem-wrap');
      const map = container.querySelector('.mini-map-section');
      const progress = container.querySelector('.progress-banner-card');
      const steps = container.querySelectorAll('.step-card');
      const cards = container.querySelectorAll('.point-card');
      if (!hero) return;

      const tl = gsap.timeline();
      tl.fromTo(map, { opacity: 0, scale: 0.985 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' })
        .fromTo(progress, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, '-=0.15')
        .fromTo(steps, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.28, stagger: 0.04, ease: 'power2.out' }, '-=0.15')
        .fromTo(cards, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.28, stagger: 0.03, ease: 'power2.out' }, '-=0.15');
    });
  }

  // Attach event handlers
  const openIntroHdr = container.querySelector('#btn-open-intro-hdr');
  openIntroHdr?.addEventListener('click', () => {
    playTapSound();
    window.dispatchEvent(new CustomEvent('open-intro-cinematic'));
  });

  const reopenIntroBtn = container.querySelector('#btn-reopen-intro');
  reopenIntroBtn?.addEventListener('click', () => {
    playTapSound();
    window.dispatchEvent(new CustomEvent('open-intro-cinematic'));
  });

  const openModalBtn = container.querySelector('#btn-open-code-modal');
  if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
      playTapSound();
      window.dispatchEvent(new CustomEvent('open-code-modal'));
    });
  }

  if (isDemo) {
    const demoResetBtn = container.querySelector('#demo-reset-btn');
    if (demoResetBtn) {
      demoResetBtn.addEventListener('click', () => {
        playTapSound();
        resetPassport();
        renderHomeView(stampsData, container);
      });
    }

    container.querySelectorAll('.demo-unlock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playTapSound();
        const id = btn.getAttribute('data-stamp-id');
        const stamp = stampsData.find(s => s.id === id);
        if (stamp) {
          window.location.hash = `#/stampila/${stamp.id}/${stamp.token}`;
        }
      });
    });
  }

  // Jump to Festival Marker on Map
  const jumpMapBtn = container.querySelector('#btn-jump-map-festival');
  if (jumpMapBtn) {
    jumpMapBtn.addEventListener('click', () => {
      playTapSound();
      const mapViewport = container.querySelector('#osm-map-container');
      if (mapViewport) {
        mapViewport.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('focus-festival-marker'));
        }, 500);
      }
    });
  }
}
