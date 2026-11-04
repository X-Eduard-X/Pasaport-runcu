/**
 * PWA Install Prompts (iOS Share Guide & Android Discreet Prompt) & New Version Toast
 */

import { icon } from './icons.js';

export function initPwaPrompts() {
  let deferredInstallPrompt = null;

  // 1. Android / Chromium BeforeInstallPrompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    showAndroidInstallBanner();
  });

  function showAndroidInstallBanner() {
    if (document.getElementById('pwa-android-toast') || sessionStorage.getItem('pwa_dismissed')) return;

    const toast = document.createElement('div');
    toast.id = 'pwa-android-toast';
    toast.className = 'pwa-toast-banner';
    toast.innerHTML = `
      <div class="pwa-toast-content">
        ${icon('download', 20)}
        <span>Instalează aplicația pentru acces rapid și offline</span>
      </div>
      <div class="pwa-toast-actions">
        <button type="button" class="btn-pwa-install" id="btn-pwa-install-exec">Instalează</button>
        <button type="button" class="btn-pwa-dismiss" id="btn-pwa-dismiss-exec" aria-label="Închide">
          ${icon('close', 16)}
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    toast.querySelector('#btn-pwa-install-exec')?.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          toast.remove();
        }
        deferredInstallPrompt = null;
      }
    });

    toast.querySelector('#btn-pwa-dismiss-exec')?.addEventListener('click', () => {
      sessionStorage.setItem('pwa_dismissed', '1');
      toast.remove();
    });
  }

  // 2. iOS Guide ("Adaugă pe ecranul principal")
  const isIos = typeof navigator !== 'undefined' &&
    /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) &&
    !(window.navigator.standalone === true);

  if (isIos && !sessionStorage.getItem('ios_guide_dismissed')) {
    setTimeout(showIosGuide, 3000);
  }

  function showIosGuide() {
    if (document.getElementById('pwa-ios-guide')) return;

    const guide = document.createElement('div');
    guide.id = 'pwa-ios-guide';
    guide.className = 'pwa-toast-banner pwa-ios-guide';
    guide.innerHTML = `
      <div class="pwa-toast-content">
        <span>Instalează pe iPhone: apasă <strong>Partajează</strong> și apoi <strong>„Adaugă pe ecranul principal”</strong>.</span>
      </div>
      <button type="button" class="btn-pwa-dismiss" id="btn-ios-dismiss" aria-label="Închide">
        ${icon('close', 16)}
      </button>
    `;

    document.body.appendChild(guide);

    guide.querySelector('#btn-ios-dismiss')?.addEventListener('click', () => {
      sessionStorage.setItem('ios_guide_dismissed', '1');
      guide.remove();
    });
  }

  // 3. New Version Available Notification
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Show non-intrusive reload banner
      showUpdateBanner();
    });
  }

  function showUpdateBanner() {
    if (document.getElementById('pwa-update-toast')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-update-toast';
    banner.className = 'pwa-toast-banner pwa-update-toast';
    banner.innerHTML = `
      <div class="pwa-toast-content">
        ${icon('refresh', 18)}
        <span>O versiune nouă a pașaportului este gata!</span>
      </div>
      <button type="button" class="btn-pwa-install" onclick="window.location.reload()">Actualizează</button>
    `;
    document.body.appendChild(banner);
  }
}
