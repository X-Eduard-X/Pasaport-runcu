/**
 * Mobile Bottom Navigation Bar (< 768px)
 * 4 Primary Expedition Tabs:
 *  - Hartă (#/)
 *  - Pașaport (#/pasaport)
 *  - Povești (#/povesti)
 *  - Jurnal (#/jurnal)
 * Touch targets >= 48px, safe-area inset support, active gold indicator.
 */

import { icon } from './icons.js';
import { getPassportData } from '../services/storage.js';

export function initBottomNav(stampsData) {
  let navEl = document.getElementById('mobile-bottom-nav');
  if (!navEl) {
    navEl = document.createElement('nav');
    navEl.id = 'mobile-bottom-nav';
    navEl.className = 'mobile-bottom-nav';
    navEl.setAttribute('aria-label', 'Navigare rapidă expediție');
    document.body.appendChild(navEl);
  }

  function update() {
    const hash = window.location.hash || '#/';
    const path = hash.split('?')[0].replace(/^#\/?/, '/');
    const isMap = path === '/' || path === '';
    const isPassport = path.startsWith('/pasaport');
    const isStories = path.startsWith('/poveste') || path.startsWith('/povesti');
    const isJournal = path.startsWith('/jurnal');

    const passport = getPassportData();
    const unlockedCount = Object.keys(passport.unlocked || {}).length;

    navEl.innerHTML = `
      <div class="bottom-nav-inner">
        <a href="#/" class="bottom-nav-item ${isMap ? 'is-active' : ''}" aria-label="Harta expediției" aria-current="${isMap ? 'page' : 'false'}">
          <div class="nav-icon-box">${icon('map', 20)}</div>
          <span class="nav-label">Hartă</span>
        </a>

        <a href="#/pasaport" class="bottom-nav-item ${isPassport ? 'is-active' : ''}" aria-label="Pașaportul și ștampilele" aria-current="${isPassport ? 'page' : 'false'}">
          <div class="nav-icon-box">
            ${icon('book', 20)}
            <span class="nav-badge-count">${unlockedCount}</span>
          </div>
          <span class="nav-label">Pașaport</span>
        </a>

        <a href="#/povesti" class="bottom-nav-item ${isStories ? 'is-active' : ''}" aria-label="Toate poveștile din Runcu" aria-current="${isStories ? 'page' : 'false'}">
          <div class="nav-icon-box">${icon('idea', 20)}</div>
          <span class="nav-label">Povești</span>
        </a>

        <a href="#/jurnal" class="bottom-nav-item ${isJournal ? 'is-active' : ''}" aria-label="Jurnalul personal de călătorie" aria-current="${isJournal ? 'page' : 'false'}">
          <div class="nav-icon-box">${icon('sparkle', 20)}</div>
          <span class="nav-label">Jurnal</span>
        </a>
      </div>
    `;
  }

  window.addEventListener('hashchange', update);
  update();

  return { update };
}
