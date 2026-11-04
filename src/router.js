/**
 * Hash Router with View Transitions API & Robust View Rendering
 * Statically imports views for instant zero-latency loading and 100% offline reliability.
 */

import { prefersReducedMotion } from './tokens.js';
import { renderHomeView } from './views/HomeView.js';
import { renderPassportView } from './views/PassportView.js';
import { renderStoryView } from './views/StoryView.js';
import { renderUnlockView } from './views/UnlockView.js';
import { renderJournalView } from './views/JournalView.js';
import { renderCertificateView } from './views/CertificateView.js';

export function initRouter({ stampsData, storiesData }, container) {
  let isNavigating = false;
  let isInitial = true;

  async function handleRoute() {
    if (isNavigating) return;
    isNavigating = true;

    try {
      const rawHash = window.location.hash || '#/';
      const [pathPart] = rawHash.split('?');
      const path = pathPart.replace(/^#\/?/, '/');

      window.scrollTo({ top: 0, behavior: 'instant' });

      const transitionFn = async () => {
        // 1. Route: #/poveste/:id
        const storyMatch = path.match(/^\/poveste\/([^/]+)\/?$/);
        if (storyMatch) {
          const storyId = storyMatch[1];
          await renderStoryView(storyId, storiesData, container);
          return;
        }

        // 2. Route: #/stampila/:id/:token
        const stampMatch = path.match(/^\/stampila\/([^/]+)\/([^/]+)\/?$/);
        if (stampMatch) {
          const stampId = stampMatch[1];
          const token = stampMatch[2];
          await renderUnlockView(stampId, token, stampsData, container);
          return;
        }

        // 3. Route: #/pasaport (Expedition Journal Booklet)
        if (path === '/pasaport') {
          renderPassportView(stampsData, container);
          return;
        }

        // 4. Route: #/jurnal (Expedition Personal Travel Journal)
        if (path === '/jurnal') {
          renderJournalView(stampsData, container);
          return;
        }

        // 5. Route: #/certificat
        if (path === '/certificat') {
          renderCertificateView(stampsData, container);
          return;
        }

        // Default route: #/ or #/povesti (Home + Mini-Map)
        renderHomeView(stampsData, container);
        if (path === '/povesti') {
          setTimeout(() => {
            const pointsEl = container.querySelector('.points-section');
            pointsEl?.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      };

      // Use native View Transitions API only on user navigation, not initial page load
      if (!isInitial && document.startViewTransition && !prefersReducedMotion()) {
        try {
          const vt = document.startViewTransition(transitionFn);
          await vt.finished.catch(() => {});
        } catch {
          await transitionFn();
        }
      } else {
        await transitionFn();
      }
    } catch (err) {
      console.error('[Router] Navigation error:', err);
      try {
        renderHomeView(stampsData, container);
      } catch {}
    } finally {
      isNavigating = false;
      isInitial = false;
    }
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  return { navigate: (hash) => { window.location.hash = hash; } };
}
