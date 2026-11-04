/**
 * Expedition Stamping Vault & Cipher Mechanism (Mecanismul de Ștampilare al Expediției)
 * Replaces generic QR scanner with a rich, unique 3-mode expedition vault:
 *  1. Cifrul Mecanic din Alamă (Rotary Brass Cryptex with 6 interactive tumblers)
 *  2. Lentila Optică de Teren (Surveyor Brass Reticle Camera Scanner with live BarcodeDetector)
 *  3. Sigiliile Runice de Teren (Heritage Sigils & Medallions of Runcu)
 */

import { icon } from './icons.js';
import { isStampUnlocked } from '../services/storage.js';
import { playSoftPopSound, playStampSound, playTapSound, triggerVibration } from '../utils/audioHaptics.js';
import { CATEGORY_META } from '../tokens.js';

const CYPHER_CHARS = [
  '0','1','2','3','4','5','6','7','8','9',
  'A','B','C','D','E','F','G','H','I','J','K','L','M',
  'N','O','P','Q','R','S','T','U','V','W','X','Y','Z'
];

export function initManualCodeModal(stampsData) {
  let modalContainer = document.getElementById('manual-code-modal-root');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'manual-code-modal-root';
    document.body.appendChild(modalContainer);
  }

  let activeTab = 'cifru'; // 'cifru' | 'camera' | 'sigilii'
  let currentTumblerValues = ['V', 'X', 'Z', 'G', '4', '8'];
  let cameraStream = null;
  let barcodeDetector = null;
  let animationFrameId = null;

  // Initialize BarcodeDetector if supported natively
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
    } catch {
      barcodeDetector = null;
    }
  }

  function stopCamera() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
  }

  function closeModal() {
    stopCamera();
    modalContainer.innerHTML = '';
  }

  function setTumblerCode(codeStr) {
    const clean = codeStr.toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(6, '0').slice(0, 6);
    currentTumblerValues = clean.split('');
    updateTumblerDisplay();
    const syncInput = modalContainer.querySelector('#cryptex-sync-input');
    if (syncInput) syncInput.value = clean;
  }

  function cycleTumbler(index, direction) {
    const currentChar = currentTumblerValues[index] || 'A';
    let charIdx = CYPHER_CHARS.indexOf(currentChar);
    if (charIdx === -1) charIdx = 0;

    if (direction === 'up') {
      charIdx = (charIdx - 1 + CYPHER_CHARS.length) % CYPHER_CHARS.length;
    } else {
      charIdx = (charIdx + 1) % CYPHER_CHARS.length;
    }

    currentTumblerValues[index] = CYPHER_CHARS[charIdx];
    playSoftPopSound();
    triggerVibration(15);
    updateTumblerDisplay(index, direction);

    const syncInput = modalContainer.querySelector('#cryptex-sync-input');
    if (syncInput) syncInput.value = currentTumblerValues.join('');
  }

  function updateTumblerDisplay(animatedIndex = -1, direction = 'down') {
    const dials = modalContainer.querySelectorAll('.cryptex-dial-col');
    dials.forEach((col, idx) => {
      const valEl = col.querySelector('.cryptex-dial-val');
      if (valEl) {
        valEl.textContent = currentTumblerValues[idx] || '0';
        if (idx === animatedIndex) {
          valEl.classList.remove('is-rolling-up', 'is-rolling-down');
          void valEl.offsetWidth; // force reflow
          valEl.classList.add(direction === 'up' ? 'is-rolling-up' : 'is-rolling-down');
        }
      }
    });
  }

  function submitCurrentCode() {
    const enteredCode = currentTumblerValues.join('').toUpperCase();
    const errEl = modalContainer.querySelector('#cryptex-error-msg');
    const casing = modalContainer.querySelector('#cryptex-casing');

    const match = stampsData.find(s => (s.code || '').toUpperCase() === enteredCode);
    if (match) {
      if (errEl) errEl.textContent = '';
      if (casing) casing.classList.add('is-unlocked-success');
      playStampSound();
      triggerVibration([40, 30, 90]);

      setTimeout(() => {
        closeModal();
        window.location.hash = `#/stampila/${match.id}/${match.token}`;
      }, 450);
    } else {
      if (casing) {
        casing.classList.remove('is-jammed-shake');
        void casing.offsetWidth;
        casing.classList.add('is-jammed-shake');
      }
      playSoftPopSound();
      triggerVibration([60, 40, 60]);
      if (errEl) {
        errEl.textContent = `Cifrul „${enteredCode}” nu corespunde niciunui obiectiv. Verifică inscripția de pe panou.`;
      }
    }
  }

  async function startCameraScanner(videoEl, statusEl) {
    stopCamera();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (statusEl) statusEl.textContent = 'Camera video nu este suportată de acest navigator web.';
      return;
    }

    try {
      if (statusEl) statusEl.textContent = 'Inițializare lentilă optică...';
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      videoEl.srcObject = cameraStream;
      await videoEl.play();
      if (statusEl) statusEl.textContent = 'Îndreaptă lentila spre codul de pe panoul oficial Runcu.';

      // Continuous barcode detection if supported
      if (barcodeDetector) {
        const checkFrame = async () => {
          if (!cameraStream || videoEl.readyState < 2) {
            animationFrameId = requestAnimationFrame(checkFrame);
            return;
          }
          try {
            const barcodes = await barcodeDetector.detect(videoEl);
            if (barcodes && barcodes.length > 0) {
              const detectedVal = barcodes[0].rawValue || '';
              handleDetectedBarcode(detectedVal);
              return; // stop scanning after detect
            }
          } catch {
            // Frame detection error, continue
          }
          animationFrameId = requestAnimationFrame(checkFrame);
        };
        animationFrameId = requestAnimationFrame(checkFrame);
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      if (statusEl) {
        statusEl.innerHTML = `Lentila optică nu are permisiune. Poți folosi <strong>Cifrul Roților din Alamă</strong>.`;
      }
    }
  }

  function handleDetectedBarcode(rawText) {
    const trimmed = (rawText || '').trim();
    // 1. Direct hash match #/stampila/:id/:token
    if (trimmed.includes('#/stampila/')) {
      const parts = trimmed.split('#/stampila/')[1]?.split('/');
      if (parts && parts.length >= 2) {
        closeModal();
        window.location.hash = `#/stampila/${parts[0]}/${parts[1]}`;
        return;
      }
    }

    // 2. Direct code match (e.g. VXZG48)
    const codeMatch = stampsData.find(s => s.code.toUpperCase() === trimmed.toUpperCase());
    if (codeMatch) {
      closeModal();
      window.location.hash = `#/stampila/${codeMatch.id}/${codeMatch.token}`;
      return;
    }

    // 3. Direct token match
    const tokenMatch = stampsData.find(s => s.token.toLowerCase() === trimmed.toLowerCase());
    if (tokenMatch) {
      closeModal();
      window.location.hash = `#/stampila/${tokenMatch.id}/${tokenMatch.token}`;
      return;
    }

    // Unrecognized format
    const statusEl = modalContainer.querySelector('#optical-status-msg');
    if (statusEl) statusEl.textContent = `Cod citit: ${trimmed.slice(0, 16)}... (nerecunoscut)`;
  }

  function renderModal(defaultTab = 'cifru', targetStampId = null) {
    activeTab = defaultTab;

    // If target stamp given, pre-fill its code
    if (targetStampId) {
      const targetStamp = stampsData.find(s => s.id === targetStampId);
      if (targetStamp && targetStamp.code) {
        currentTumblerValues = targetStamp.code.toUpperCase().padEnd(6, '0').slice(0, 6).split('');
      }
    }

    modalContainer.innerHTML = `
      <div class="modal-backdrop expedition-vault-backdrop" id="vault-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="vault-modal-title">
        <div class="modal-card expedition-vault-card">
          <button type="button" class="modal-close-btn" id="vault-close-x" aria-label="Închide mecanismul de ștampilare">
            ${icon('close', 18)}
          </button>

          <!-- Vault Header -->
          <div class="vault-header">
            <div class="vault-emblem-badge" aria-hidden="true">
              ${icon('key', 22)}
            </div>
            <h2 class="modal-title vault-title" id="vault-modal-title">Mecanismul de Ștampilare</h2>
            <p class="vault-subtitle">Jurnalul de Teren • Runcu • Lider European 2026</p>
          </div>

          <!-- Mode Navigation Tabs -->
          <nav class="vault-tabs-nav" aria-label="Moduri de validare ștampilă">
            <button type="button" class="vault-tab-btn ${activeTab === 'cifru' ? 'is-active' : ''}" data-tab="cifru" title="Cifrul mecanic din alamă">
              ${icon('key', 15)}
              <span>Cifru Roți</span>
            </button>
            <button type="button" class="vault-tab-btn ${activeTab === 'camera' ? 'is-active' : ''}" data-tab="camera" title="Lentila optică de campanie">
              ${icon('camera', 15)}
              <span>Lentilă</span>
            </button>
            <button type="button" class="vault-tab-btn ${activeTab === 'sigilii' ? 'is-active' : ''}" data-tab="sigilii" title="Sigiliile de teren ale comunei">
              ${icon('sparkle', 15)}
              <span>Sigilii</span>
            </button>
          </nav>

          <!-- Tab Content Containers -->
          <div class="vault-tab-stage" id="vault-stage">
            <!-- Rendered by switchTab() -->
          </div>
        </div>
      </div>
    `;

    // Bind outer backdrop & close button
    const backdrop = modalContainer.querySelector('#vault-modal-backdrop');
    const closeBtn = modalContainer.querySelector('#vault-close-x');
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
    closeBtn?.addEventListener('click', () => {
      playTapSound();
      closeModal();
    });

    // Tab buttons
    modalContainer.querySelectorAll('.vault-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playTapSound();
        const tab = btn.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    // Keyboard ESC listener
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        window.removeEventListener('keydown', handleKeydown);
      }
    };
    window.addEventListener('keydown', handleKeydown);

    // Initial tab mount
    switchTab(activeTab);
  }

  function switchTab(tab) {
    activeTab = tab;
    stopCamera();

    // Update tab pills state
    modalContainer.querySelectorAll('.vault-tab-btn').forEach(btn => {
      const match = btn.getAttribute('data-tab') === tab;
      btn.classList.toggle('is-active', match);
      btn.setAttribute('aria-selected', match ? 'true' : 'false');
    });

    const stage = modalContainer.querySelector('#vault-stage');
    if (!stage) return;

    if (tab === 'cifru') {
      renderCryptexTab(stage);
    } else if (tab === 'camera') {
      renderCameraTab(stage);
    } else if (tab === 'sigilii') {
      renderSigilsTab(stage);
    }
  }

  // -------------------------------------------------------------
  // TAB 1: CIFRUL MECANIC DIN ALAMĂ (ROTARY CRYPTEX)
  // -------------------------------------------------------------
  function renderCryptexTab(container) {
    const physicalStamps = stampsData.filter(s => s.category === 'A' || s.isPhysical);

    container.innerHTML = `
      <div class="cryptex-pane">
        <p class="cryptex-guide-text">
          Aliniază cele 6 inele din alamă cu codul de expediție gravat pe panoul de la obiectiv sau tastează-l mai jos:
        </p>

        <!-- Mechanical Tumbler Cryptex Housing -->
        <div class="cryptex-housing" id="cryptex-casing" role="group" aria-label="Cifru mecanic cu 6 inele din alamă">
          <div class="cryptex-housing-header">
            <span class="cryptex-rivet" aria-hidden="true"></span>
            <span class="cryptex-brand-plate">CIFRU ALAMĂ • RUNICUS</span>
            <span class="cryptex-rivet" aria-hidden="true"></span>
          </div>

          <div class="cryptex-tumblers-row">
            ${currentTumblerValues.map((val, idx) => `
              <div class="cryptex-dial-col" data-index="${idx}">
                <button type="button" class="cryptex-arrow-btn cryptex-arrow-up" data-action="up" data-index="${idx}" aria-label="Următorul caracter inel ${idx + 1}">
                  ▲
                </button>
                <div class="cryptex-dial-slot">
                  <div class="cryptex-dial-reflection" aria-hidden="true"></div>
                  <span class="cryptex-dial-val">${val}</span>
                </div>
                <button type="button" class="cryptex-arrow-btn cryptex-arrow-down" data-action="down" data-index="${idx}" aria-label="Precedentul caracter inel ${idx + 1}">
                  ▼
                </button>
              </div>
            `).join('')}
          </div>

          <div class="cryptex-housing-footer">
            <div class="cryptex-indicator-line" aria-hidden="true"></div>
          </div>
        </div>

        <!-- Fast Typing Input Sync -->
        <div class="cryptex-fast-input-wrap">
          <label for="cryptex-sync-input" class="cryptex-input-label">
            ${icon('key', 14)}
            <span>Sau introdu direct codul de 6 caractere:</span>
          </label>
          <input 
            type="text" 
            id="cryptex-sync-input" 
            class="modal-input-code cryptex-sync-field" 
            maxlength="6" 
            value="${currentTumblerValues.join('')}" 
            placeholder="EX: VXZG48"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            aria-label="Cod de 6 caractere pentru deblocare cifru"
          />
        </div>

        <div class="modal-error-msg" id="cryptex-error-msg" role="alert"></div>

        <button type="button" class="btn-primary-action btn-vault-action" id="btn-submit-cryptex" style="width: 100%;">
          ${icon('unlock', 18)}
          <span>Validează &amp; Deblochează Ștampila</span>
        </button>

        <!-- Quick Field Locations Chips Accordion -->
        <div class="cryptex-field-chips-box">
          <span class="field-chips-title">Indicii din teren (Cifrele Obiectivelor A):</span>
          <div class="field-chips-grid">
            ${physicalStamps.map(st => `
              <button type="button" class="field-chip-btn" data-code="${st.code}" title="${st.title}">
                <span class="field-chip-name">${st.title.split('—')[0].split('(')[0].trim().slice(0, 18)}</span>
                <span class="field-chip-code">${st.code}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Bind arrow buttons
    container.querySelectorAll('.cryptex-arrow-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        const action = btn.getAttribute('data-action');
        cycleTumbler(idx, action);
      });
    });

    // Fast input sync
    const syncInput = container.querySelector('#cryptex-sync-input');
    syncInput?.addEventListener('input', () => {
      const sanitized = syncInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      syncInput.value = sanitized;
      setTumblerCode(sanitized);
      const errEl = container.querySelector('#cryptex-error-msg');
      if (errEl) errEl.textContent = '';
    });

    // Submit button
    const submitBtn = container.querySelector('#btn-submit-cryptex');
    submitBtn?.addEventListener('click', () => {
      submitCurrentCode();
    });

    // Pressing Enter in syncInput submits
    syncInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitCurrentCode();
      }
    });

    // Field chips quick loader
    container.querySelectorAll('.field-chip-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        playSoftPopSound();
        const code = chip.getAttribute('data-code');
        if (code) {
          setTumblerCode(code);
          const errEl = container.querySelector('#cryptex-error-msg');
          if (errEl) errEl.textContent = '';
        }
      });
    });
  }

  // -------------------------------------------------------------
  // TAB 2: LENTILA OPTICĂ DE TEREN (SURVEYOR CAMERA RETICLE)
  // -------------------------------------------------------------
  function renderCameraTab(container) {
    container.innerHTML = `
      <div class="optical-pane">
        <p class="optical-guide-text">
          Lentila de campanie detectează automat codurile de pe panourile monumentelor din Runcu.
        </p>

        <!-- Surveyor Reticle Viewport -->
        <div class="surveyor-reticle-box">
          <video class="surveyor-video" id="surveyor-video-stream" playsinline muted autoplay></video>
          
          <!-- Brass Antique Surveyor Reticle Overlay -->
          <div class="surveyor-overlay" aria-hidden="true">
            <div class="surveyor-compass-ring">
              <span class="compass-deg n">N 0°</span>
              <span class="compass-deg e">E 90°</span>
              <span class="compass-deg s">S 180°</span>
              <span class="compass-deg w">W 270°</span>
            </div>

            <div class="surveyor-crosshair"></div>
            <div class="surveyor-scanline"></div>
            <div class="surveyor-target-corners">
              <span class="corner tl"></span>
              <span class="corner tr"></span>
              <span class="corner bl"></span>
              <span class="corner br"></span>
            </div>
          </div>
        </div>

        <p class="optical-status-msg" id="optical-status-msg">
          Punctează lentila spre panoul oficial al obiectivului...
        </p>

        <div class="optical-actions-row">
          <button type="button" class="btn-secondary-action" id="btn-switch-to-cryptex" style="width: 100%;">
            ${icon('key', 16)}
            <span>Comută la Cifrul Roților din Alamă</span>
          </button>
        </div>
      </div>
    `;

    const videoEl = container.querySelector('#surveyor-video-stream');
    const statusEl = container.querySelector('#optical-status-msg');
    const switchCryptexBtn = container.querySelector('#btn-switch-to-cryptex');

    switchCryptexBtn?.addEventListener('click', () => {
      playTapSound();
      switchTab('cifru');
    });

    if (videoEl) {
      startCameraScanner(videoEl, statusEl);
    }
  }

  // -------------------------------------------------------------
  // TAB 3: SIGILIILE DE TEREN (HERITAGE SIGIL COINS)
  // -------------------------------------------------------------
  function renderSigilsTab(container) {
    let sigilsFilter = 'all'; // 'all' | 'A' | 'others'

    function drawSigils() {
      const filtered = stampsData.filter(s => {
        if (sigilsFilter === 'A') return s.category === 'A';
        if (sigilsFilter === 'others') return s.category !== 'A';
        return true;
      });

      return `
        <div class="sigils-pane">
          <p class="sigils-guide-text">
            Fiecare obiectiv și tradiție poartă un sigiliu recunoscut oficial. Atinge un sigiliu pentru a-i aplica amprenta în pașaport:
          </p>

          <div class="sigils-filter-row" role="tablist" aria-label="Filtrare sigilii">
            <button type="button" class="sigil-filter-chip ${sigilsFilter === 'all' ? 'is-active' : ''}" data-cat="all">Toate (12)</button>
            <button type="button" class="sigil-filter-chip ${sigilsFilter === 'A' ? 'is-active' : ''}" data-cat="A">Obiective Teren (5)</button>
            <button type="button" class="sigil-filter-chip ${sigilsFilter === 'others' ? 'is-active' : ''}" data-cat="others">Povești &amp; Tradiții (7)</button>
          </div>

          <div class="sigils-grid">
            ${filtered.map(stamp => {
              const unlocked = isStampUnlocked(stamp.id);
              const cat = CATEGORY_META[stamp.category] || CATEGORY_META.A;
              const isPhysical = stamp.category === 'A' || stamp.isPhysical;

              return `
                <div class="sigil-coin-card ${unlocked ? 'is-collected' : 'is-uncollected'}" data-id="${stamp.id}">
                  <div class="sigil-coin-metal" style="--sigil-cat-color: ${cat.color};">
                    <div class="sigil-coin-inner">
                      ${unlocked ? icon('checkCircle', 22) : (isPhysical ? icon('stamp', 22) : icon('sparkle', 22))}
                    </div>
                  </div>

                  <div class="sigil-coin-details">
                    <div class="sigil-coin-cat" style="color: ${cat.color};">
                      ${cat.iconSvg} <span>${cat.labelRo}</span>
                    </div>
                    <h4 class="sigil-coin-title">${stamp.title}</h4>
                    <span class="sigil-coin-code">Cifru: <strong>${stamp.code}</strong></span>
                  </div>

                  <div class="sigil-coin-action">
                    ${unlocked ? `
                      <span class="sigil-badge-collected">${icon('check', 12)} Colectat</span>
                    ` : (isPhysical ? `
                      <button type="button" class="btn-sigil-apply" data-id="${stamp.id}" data-token="${stamp.token}" aria-label="Aplică ștampila pentru ${stamp.title}">
                        ${icon('stamp', 14)}
                        <span>Activează</span>
                      </button>
                    ` : `
                      <a href="#/poveste/${stamp.id}" class="btn-sigil-story" aria-label="Deschide povestea ${stamp.title}">
                        ${icon('play', 14)}
                        <span>Poveste</span>
                      </a>
                    `)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = drawSigils();

    function bindSigilEvents() {
      container.querySelectorAll('.sigil-filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          playTapSound();
          sigilsFilter = chip.getAttribute('data-cat');
          container.innerHTML = drawSigils();
          bindSigilEvents();
        });
      });

      // Direct physical stamp apply
      container.querySelectorAll('.btn-sigil-apply').forEach(btn => {
        btn.addEventListener('click', () => {
          playStampSound();
          triggerVibration([40, 20, 80]);
          const id = btn.getAttribute('data-id');
          const token = btn.getAttribute('data-token');
          closeModal();
          window.location.hash = `#/stampila/${id}/${token}`;
        });
      });

      // Story links close the modal
      container.querySelectorAll('.btn-sigil-story').forEach(btn => {
        btn.addEventListener('click', () => {
          closeModal();
        });
      });
    }

    bindSigilEvents();
  }

  return {
    openModal: (tab = 'cifru', stampId = null) => renderModal(tab, stampId),
    closeModal
  };
}
