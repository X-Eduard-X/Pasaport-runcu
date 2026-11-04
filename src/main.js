/**
 * Application Entry Point — „Pașaportul Runcului”
 * Lider European 2026 • Comuna Runcu, Județul Gorj
 */

import './styles/fonts.css';
import './styles/app.css';
import { injectIconSprite } from './components/icons.js';
import { initGlobalSoftFeedback } from './utils/audioHaptics.js';
import { initRouter } from './router.js';
import { initPwaPrompts } from './components/PwaInstallPrompt.js';
import { initAmbientBackground } from './components/AmbientBackground.js';
import { initBottomNav } from './components/BottomNav.js';
import { initIntroCinematic, hasSeenSessionIntro } from './components/IntroCinematic.js';
import { runStartupFpsProbe } from './utils/quality.js';
import { subscribeToStorage } from './services/storage.js';

async function loadData() {
  let stamps = [];
  let stories = [];

  try {
    const stampsRes = await fetch('./data/stamps.json');
    if (stampsRes.ok) {
      const data = await stampsRes.json();
      stamps = Array.isArray(data) ? data : data.stamps || [];
    }
  } catch (err) {
    console.warn('[App] Could not fetch stamps.json:', err.message);
  }

  try {
    const storiesRes = await fetch('./data/stories.json');
    if (storiesRes.ok) {
      const data = await storiesRes.json();
      stories = Array.isArray(data) ? data : data.stories || [];
    }
  } catch (err) {
    console.warn('[App] Could not fetch stories.json:', err.message);
  }

  return { stamps, stories };
}

async function initApp() {
  const container = document.getElementById('app');
  if (!container) return;

  // Invalidate and inject icon sprite for all symbols
  injectIconSprite();

  // Initialize soft acoustic and tactile feedback on all clicks
  initGlobalSoftFeedback();

  // Initialize procedural ambient background (topography drift + embers)
  initAmbientBackground();

  const { stamps, stories } = await loadData();

  // Initialize and handle Expedition Stamping Vault modal
  let vaultModal = null;
  window.addEventListener('open-code-modal', async (e) => {
    if (!vaultModal) {
      const { initManualCodeModal } = await import('./components/ManualCodeModal.js');
      vaultModal = initManualCodeModal(stamps);
    }
    const detail = e?.detail || {};
    vaultModal.openModal(detail.tab || 'cifru', detail.stampId || null);
  });

  // Application boot orchestration (Intro -> Main App)
  let appStarted = false;
  const startMainApp = () => {
    if (appStarted) return;
    appStarted = true;

    // Initialize PWA installation prompts
    initPwaPrompts();

    // Initialize Mobile Bottom Navigation
    initBottomNav(stamps);

    // Initialize router with code splitting
    initRouter({ stampsData: stamps, storiesData: stories }, container);

    // Subscribe to storage changes
    subscribeToStorage(() => {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    // Run startup FPS probe
    runStartupFpsProbe();

    // Defer Service Worker registration via requestIdleCallback
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      const scheduleSw = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
      scheduleSw(() => {
        navigator.serviceWorker.register('./sw.js').catch(err => {
          console.log('[SW] Registration failed:', err);
        });
      });
    }
  };

  const rawHash = window.location.hash || '#/';
  const isRootRoute = !rawHash || rawHash === '#/' || rawHash === '#';
  const shouldRunCinematic = !hasSeenSessionIntro() && isRootRoute;

  const intro = initIntroCinematic({
    onComplete: () => {
      startMainApp();
    }
  });

  if (shouldRunCinematic) {
    intro.showIntro();
  } else {
    startMainApp();
  }
}

initApp();
