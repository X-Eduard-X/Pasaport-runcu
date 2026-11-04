/**
 * Personal Expedition Travel Journal View (#/jurnal)
 * Records chronological expedition log of unlocked stamps,
 * allows user to write and persist personal field notes,
 * and review travel memories from Comuna Runcu.
 */

import { getPassportData, getJournalNotes, saveJournalNote, getUserName } from '../services/storage.js';
import { CATEGORY_META } from '../tokens.js';
import { icon } from '../components/icons.js';
import { picture } from '../utils/img.js';
import { playTapSound, triggerVibration } from '../utils/audioHaptics.js';

export function renderJournalView(stampsData, container) {
  const passport = getPassportData();
  const notes = getJournalNotes();
  const userName = getUserName() || 'Călător';
  const unlockedMap = passport.unlocked || {};
  const unlockedIds = Object.keys(unlockedMap);

  // Sort unlocked entries chronologically (oldest first or newest first)
  const entries = unlockedIds.map(id => {
    const stamp = stampsData.find(s => s.id === id);
    const info = unlockedMap[id];
    const userNote = notes[id]?.text || '';
    return {
      stamp,
      info,
      userNote
    };
  }).filter(e => e.stamp)
    .sort((a, b) => (b.info.timestamp || 0) - (a.info.timestamp || 0));

  container.innerHTML = `
    <!-- Top Header -->
    <header class="app-header">
      <div class="app-brand">
        <a href="#/" class="btn-hdr-back" title="Înapoi" aria-label="Înapoi">
          ${icon('back', 18)}
          <span class="brand-title">Jurnal de Teren</span>
        </a>
      </div>
      <div class="header-actions">
        <a href="#/pasaport" class="btn-header-code" title="Vezi pașaportul" aria-label="Vezi pașaportul">
          ${icon('book', 16)}
          <span>Pașaport</span>
        </a>
      </div>
    </header>

    <main class="journal-travel-page">
      <section class="journal-hero-card">
        <div class="journal-kicker">MEMORIILE EXPEDIȚIEI • RUNCU</div>
        <h1 class="journal-title">Jurnalul lui ${userName}</h1>
        <p class="journal-subtitle">
          ${entries.length > 0 
            ? `Ai înregistrat ${entries.length} obiective în călătoria ta prin Munții Vâlcan. Fiecare intrare păstrează data, locul și gândurile tale de drum.`
            : 'Fiecare ștampilă obținută pe teren sau poveste citită va fi consemnată automat aici, unde poți adăuga propriile notițe de călătorie.'}
        </p>
      </section>

      ${entries.length === 0 ? `
        <!-- Empty State -->
        <div class="journal-empty-state">
          <div class="journal-empty-icon" aria-hidden="true">${icon('sparkle', 36)}</div>
          <h2 class="journal-empty-title">Nicio intrare de călătorie încă</h2>
          <p class="journal-empty-desc">
            Explorează mini-harta din Runcu, citește primele povești sau scanează cifrul unui monument pentru a începe jurnalul personal.
          </p>
          <a href="#/" class="btn-primary-action" style="display: inline-flex; margin-top: 1rem;">
            ${icon('map', 18)}
            <span>Mergi la Hartă</span>
          </a>
        </div>
      ` : `
        <!-- Chronological Timeline -->
        <div class="journal-timeline">
          ${entries.map(({ stamp, info, userNote }) => {
            const cat = CATEGORY_META[stamp.category] || CATEGORY_META.A;
            const [lng, lat] = stamp.coordinates || [0, 0];

            return `
              <article class="journal-entry-card" data-id="${stamp.id}">
                <div class="journal-entry-meta">
                  <div class="journal-entry-cat" style="color: ${cat.color};">
                    ${cat.iconSvg}
                    <span>${cat.labelRo}</span>
                  </div>
                  <time class="journal-entry-date">
                    ${info.dateFormatted || ''} • ${info.timeFormatted || ''}
                  </time>
                </div>

                <div class="journal-entry-main">
                  <div class="journal-entry-thumb">
                    ${picture(stamp.photoMeta, {
                      alt: stamp.title,
                      className: 'journal-thumb-img',
                      fallbackSrc: stamp.photo
                    })}
                  </div>

                  <div class="journal-entry-body">
                    <h3 class="journal-entry-title">${stamp.title}</h3>
                    <p class="journal-entry-gps">
                      ${icon('pin', 12)} Coordonate: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
                    </p>
                    <p class="journal-entry-desc">${stamp.shortDescription}</p>

                    <!-- User Note Field -->
                    <div class="journal-note-box">
                      <label for="note-${stamp.id}" class="journal-note-label">
                        ${icon('sparkle', 13)}
                        <span>Amintirea / Notița ta de călătorie:</span>
                      </label>
                      <textarea
                        id="note-${stamp.id}"
                        class="journal-note-textarea"
                        rows="2"
                        placeholder="Notează un gând, o senzație sau o descoperire..."
                        aria-label="Notiță personală pentru ${stamp.title}"
                      >${userNote}</textarea>
                      <span class="journal-note-status" id="status-${stamp.id}"></span>
                    </div>
                  </div>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      `}
    </main>
  `;

  // Attach auto-save event listeners to textareas
  container.querySelectorAll('.journal-note-textarea').forEach(textarea => {
    let timeout = null;
    textarea.addEventListener('input', () => {
      const stampId = textarea.id.replace('note-', '');
      const statusEl = container.querySelector(`#status-${stampId}`);
      if (statusEl) statusEl.textContent = 'Salvare...';

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        saveJournalNote(stampId, textarea.value);
        if (statusEl) {
          statusEl.textContent = '✓ Salvat';
          setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 1800);
        }
      }, 500);
    });
  });
}
