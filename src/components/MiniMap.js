/**
 * Interactive OpenStreetMap Component with Leaflet
 * - Real OpenStreetMap Cartographic Tile Layer (High-DPI Retina with OSM data)
 * - Runcu Administrative Boundary GeoJSON Overlay (Gold Foil & Pine Emerald)
 * - 7 Village Markers (Runcu, Bâlta, Bâltișoara, Dobrița, Răchiți, Suseni, Valea Mare)
 * - 12 Story & Stamp Beacon Markers with Category Ink Colors & Pulse
 * - Bottom Sheet Drawer with Story Preview & Navigation
 * - Floating GPS "Locația Mea" & Quick Reset Controls
 * - Category Filter Chips (ALL, A, B, C, D)
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CATEGORY_META } from '../tokens.js';
import { APP_CONFIG } from '../config.js';
import { RUNCU_VILLAGES, MAP_BOUNDS } from '../data/mapData.js';
import { isStampUnlocked } from '../services/storage.js';
import { icon } from './icons.js';
import { picture } from '../utils/img.js';
import { playTapSound, triggerVibration } from '../utils/audioHaptics.js';
import { calculateHaversineDistance, calculateBearing } from '../utils/geo.js';

export function createMiniMap(containerEl, waypoints) {
  let activeId = null;
  let currentCategory = 'ALL';
  let userMarker = null;
  let userAccuracy = null;
  const markerLayerMap = new Map();

  const counts = { A: 0, B: 0, C: 0, D: 0 };
  waypoints.forEach(w => { counts[w.category] = (counts[w.category] || 0) + 1; });

  const chip = (cat, label) => `
    <button type="button" class="map-chip ${cat === 'ALL' ? 'is-active' : ''}" data-cat="${cat}"
      aria-pressed="${cat === 'ALL'}" ${cat !== 'ALL' ? `style="--chip-color: ${CATEGORY_META[cat].color}"` : ''}>
      ${cat !== 'ALL' ? `<span class="chip-dot" aria-hidden="true"></span>` : ''}${label}
    </button>`;

  containerEl.innerHTML = `
    <div class="mini-map-card">
      <!-- Category Filter Chips -->
      <div class="map-chips-bar" role="group" aria-label="Filtrează locurile după categorie">
        ${chip('ALL', `Toate (${waypoints.length})`)}
        ${chip('A', `Obiective (${counts.A})`)}
        ${chip('B', `Tradiții (${counts.B})`)}
        ${chip('C', `Personalități (${counts.C})`)}
        ${chip('D', `Povești (${counts.D})`)}
      </div>

      <!-- Real OpenStreetMap Leaflet Viewport -->
      <div class="osm-map-viewport" id="osm-map-container" tabindex="0"
           aria-label="Harta OpenStreetMap a comunei Runcu. Include conturul comunei, satele și obiectivele turistice.">
        
        <!-- Floating Controls -->
        <div class="map-controls-floating">
          <button type="button" class="btn-map-ctrl" id="btn-zoom-in" aria-label="Apropie harta">${icon('plus')}</button>
          <button type="button" class="btn-map-ctrl" id="btn-zoom-out" aria-label="Depărtează harta">${icon('minus')}</button>
          <button type="button" class="btn-map-ctrl" id="btn-reset-view" aria-label="Recentrare Comuna Runcu" title="Recentrare Runcu">${icon('reset')}</button>
          <button type="button" class="btn-map-ctrl btn-gps" id="btn-locate-me" aria-label="Locația mea pe hartă" title="Unde ești">${icon('locate')}</button>
          <button type="button" class="btn-map-ctrl btn-compass" id="btn-map-compass" aria-label="Busola exploratorului" title="Găsește cel mai apropiat obiectiv">${icon('compass')}</button>
        </div>

        <!-- Fog of War Overlay ("Ceața se risipește") -->
        <div class="map-fog-canvas-wrap" id="map-fog-wrap" aria-hidden="true">
          <canvas class="map-fog-canvas" id="map-fog-canvas"></canvas>
          <div class="map-fog-dawn-glow" id="map-dawn-glow"></div>
        </div>

        <!-- Compass readout badge -->
        <div class="map-compass-badge" id="map-compass-badge" hidden aria-live="polite"></div>

        <p class="map-legend-note">Harta OpenStreetMap • Datele GPS rămân exclusiv pe telefonul tău.</p>
      </div>

      <!-- Bottom Sheet Drawer -->
      <div class="map-bottom-sheet" id="map-bottom-sheet" role="dialog" aria-modal="false" aria-label="Detalii loc" hidden>
        <div class="sheet-drag-handle" aria-hidden="true"></div>
        <div class="sheet-content" id="sheet-content"></div>
      </div>
    </div>
  `;

  const mapContainer = containerEl.querySelector('#osm-map-container');
  const sheet = containerEl.querySelector('#map-bottom-sheet');
  const sheetContent = containerEl.querySelector('#sheet-content');

  // Deferred initialization to allow initial hero DOM & LCP to render instantly
  const initMap = () => {
    if (mapContainer._leaflet_id) return;

    // Well-balanced bounds for Comuna Runcu: covers all 7 villages, Sohodol Gorges & Arcanu Peak
    const runcuViewportBounds = L.latLngBounds(
      [45.080, 23.018],
      [45.252, 23.222]
    );

    const map = L.map(mapContainer, {
      zoomControl: false,
      attributionControl: false,
      maxBounds: L.latLngBounds([44.96, 22.85], [45.40, 23.40]),
      minZoom: 10,
      maxZoom: 18
    });

    // Official OpenStreetMap Tile Layer — 100% Free, Public, Reliable & NO API Key Required
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 10,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
    }).addTo(map);

    // Add discreet attribution badge
    const attrDiv = document.createElement('div');
    attrDiv.className = 'osm-attribution-badge';
    attrDiv.innerHTML = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
    mapContainer.appendChild(attrDiv);

    map.fitBounds(runcuViewportBounds, { padding: [16, 16] });

    // Load and display Runcu boundary GeoJSON overlay
    fetch('./data/runcu-boundary.geojson')
      .then(r => r.ok ? r.json() : null)
      .then(geojson => {
        if (geojson) {
          L.geoJSON(geojson, {
            style: {
              color: '#D8A24A', // Metal gold foil
              weight: 3,
              opacity: 0.92,
              dashArray: '6, 6',
              fillColor: '#198764', // Emerald pine
              fillOpacity: 0.08
            }
          }).addTo(map);
          map.fitBounds(runcuViewportBounds, { padding: [16, 16] });
        }
      })
      .catch(() => {});

    // Add the 7 Villages as informative text markers
    RUNCU_VILLAGES.forEach(village => {
      const villageIcon = L.divIcon({
        className: 'osm-village-div-icon',
        html: `
          <div class="osm-village-badge">
            <span class="osm-village-dot" aria-hidden="true"></span>
            <span>${village.name}</span>
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [40, 12]
      });

      L.marker([village.coords[1], village.coords[0]], {
        icon: villageIcon,
        interactive: false,
        zIndexOffset: -50
      }).addTo(map);
    });

    // Create Waypoint / Story Stamp Markers
    const markersGroup = L.layerGroup().addTo(map);

    function createMarkerIcon(wp, isUnlocked, isActive = false) {
      const cat = CATEGORY_META[wp.category];
      return L.divIcon({
        className: 'osm-custom-div-icon',
        html: `
          <div class="osm-marker-wrap ${isUnlocked ? 'is-unlocked' : ''} ${isActive ? 'is-active' : ''}" style="--marker-color: ${cat.color}">
            <div class="osm-marker-pulse" aria-hidden="true"></div>
            <div class="osm-marker-core">
              ${isUnlocked ? icon('check', 12) : `<span class="marker-cat-letter">${wp.category}</span>`}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
    }

    waypoints.forEach(wp => {
      const unlocked = isStampUnlocked(wp.id);
      const marker = L.marker([wp.coordinates[1], wp.coordinates[0]], {
        icon: createMarkerIcon(wp, unlocked),
        title: wp.title,
        keyboard: false
      });

      marker.on('click', () => {
        openSheet(wp);
      });

      // Desktop Cross-linking: hover marker highlights passport slot
      marker.on('mouseover', () => {
        window.dispatchEvent(new CustomEvent('highlight-passport-slot', {
          detail: { id: wp.id }
        }));
      });

      marker.on('mouseout', () => {
        window.dispatchEvent(new CustomEvent('highlight-passport-slot', {
          detail: { id: null }
        }));
      });

      markerLayerMap.set(wp.id, { marker, wp });
      markersGroup.addLayer(marker);
    });

    // Special Cultural Beacon: Festivalul Internațional de Umor și Caricatură „Ion Cănăvoiu”
    const festivalCoords = [45.1215, 23.1390];
    const festivalDivIcon = L.divIcon({
      className: 'osm-custom-div-icon osm-festival-div-icon',
      html: `
        <div class="osm-marker-wrap osm-festival-marker-wrap is-active" style="--marker-color: #8B5CF6">
          <div class="osm-marker-pulse osm-festival-pulse" aria-hidden="true"></div>
          <div class="osm-marker-core osm-festival-core" title="Festivalul Internațional de Umor și Caricatură „Ion Cănăvoiu”">
            <span class="festival-marker-icon" aria-hidden="true">🎭</span>
          </div>
          <span class="osm-festival-label-pill">Festivalul Ion Cănăvoiu</span>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21]
    });

    const festivalMarker = L.marker(festivalCoords, {
      icon: festivalDivIcon,
      title: 'Festivalul Internațional de Umor și Caricatură „Ion Cănăvoiu”',
      zIndexOffset: 120
    });

    festivalMarker.on('click', () => {
      openFestivalSheet();
    });

    markersGroup.addLayer(festivalMarker);

    // Cross-linking Listener: Highlight from Passport/Desk hover
    window.addEventListener('highlight-map-waypoint', (e) => {
      const targetId = e.detail?.id;
      markerLayerMap.forEach(({ marker, wp }) => {
        const iconEl = marker.getElement();
        if (iconEl) {
          const wrap = iconEl.querySelector('.osm-marker-wrap');
          if (wrap) {
            wrap.classList.toggle('is-desk-highlighted', wp.id === targetId);
          }
        }
      });
    });

    // ---------------------------------------------------------
    // "Ceața se risipește" (Fog of War) Implementation
    // ---------------------------------------------------------
    const fogCanvas = containerEl.querySelector('#map-fog-canvas');
    const dawnGlow = containerEl.querySelector('#map-dawn-glow');
    let fogCtx = fogCanvas?.getContext('2d');

    function renderFogOfWar() {
      if (!fogCanvas || !fogCtx) return;
      const width = mapContainer.clientWidth;
      const height = mapContainer.clientHeight;
      if (width === 0 || height === 0) return;

      if (fogCanvas.width !== width || fogCanvas.height !== height) {
        fogCanvas.width = width;
        fogCanvas.height = height;
      }

      const unlockedWaypoints = waypoints.filter(w => isStampUnlocked(w.id));
      const allUnlocked = unlockedWaypoints.length >= waypoints.length && waypoints.length > 0;

      if (allUnlocked) {
        // Complete illumination! Fog dissolves entirely
        fogCtx.clearRect(0, 0, width, height);
        if (dawnGlow) dawnGlow.classList.add('is-dawn-illuminated');
        return;
      }

      // Draw misty atmospheric fog layer
      fogCtx.globalCompositeOperation = 'source-over';
      fogCtx.fillStyle = 'rgba(6, 12, 10, 0.42)';
      fogCtx.fillRect(0, 0, width, height);

      // Dissolve fog around unlocked waypoints via destination-out
      fogCtx.globalCompositeOperation = 'destination-out';
      unlockedWaypoints.forEach(wp => {
        const pt = map.latLngToContainerPoint([wp.coordinates[1], wp.coordinates[0]]);
        const radius = 64;
        const gradient = fogCtx.createRadialGradient(pt.x, pt.y, 10, pt.x, pt.y, radius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        fogCtx.fillStyle = gradient;
        fogCtx.beginPath();
        fogCtx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        fogCtx.fill();
      });

      fogCtx.globalCompositeOperation = 'source-over';
    }

    // Keep fog holes anchored during map pan/zoom
    map.on('move', renderFogOfWar);
    map.on('zoom', renderFogOfWar);
    setTimeout(renderFogOfWar, 200);

    // Open Bottom Sheet with Place & Story Details
    function openSheet(wp) {
      playTapSound();
      triggerVibration([30]);
      activeId = wp.id;

      const cat = CATEGORY_META[wp.category];
      const unlocked = isStampUnlocked(wp.id);
      const [lng, lat] = wp.coordinates;
      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      sheetContent.innerHTML = `
        <div class="sheet-header-row">
          <span class="sheet-cat-badge" style="--cat-color:${cat.color}">
            ${cat.iconSvg}
            <span>${cat.labelRo}</span>
          </span>
          <button type="button" class="sheet-close-btn" id="sheet-close-btn" aria-label="Închide detaliile">
            ${icon('close', 18)}
          </button>
        </div>
        <div class="sheet-body-grid">
          <div class="sheet-thumb-wrap" style="view-transition-name: hero-${wp.id}">
            ${picture(wp.photoMeta, { alt: wp.title, sizes: '96px', className: 'sheet-thumb-img', fallbackSrc: wp.photo })}
            <span class="sheet-status-tag ${unlocked ? 'is-unlocked' : 'is-locked'}">
              ${unlocked ? `${icon('check', 11)} Ștampilat` : 'Neștampilat'}
            </span>
          </div>
          <div class="sheet-text-col">
            <h3 class="sheet-place-title">${wp.title}</h3>
            <p class="sheet-place-desc">${wp.shortDescription}</p>
          </div>
        </div>
        <div class="sheet-actions-row">
          <a href="#/poveste/${wp.id}" class="btn-sheet-primary" style="flex: 2;">
            ${icon('play', 16)}
            <span>Deschide Povestea</span>
          </a>
          ${wp.category === 'A' ? `
            <a href="${navUrl}" target="_blank" rel="noopener" class="btn-sheet-secondary">
              ${icon('navigate', 16)}
              <span>Navighează</span>
            </a>
          ` : ''}
        </div>
        <a href="${APP_CONFIG.MAP_URL}#/punct/${wp.id}" target="_blank" rel="noopener" class="btn-sheet-discreet">
          Vezi și pe Harta 3D Completă
        </a>
      `;

      sheet.hidden = false;
      requestAnimationFrame(() => sheet.classList.add('is-open'));
      sheetContent.querySelector('#sheet-close-btn')?.addEventListener('click', closeSheet);

      // Pan map to center slightly below point so bottom sheet does not obscure it
      map.flyTo([lat, lng], Math.max(map.getZoom(), 13), {
        duration: 0.6,
        easeLinearity: 0.25
      });
    }

    function openFestivalSheet() {
      activeId = 'festival-canavoiu';
      playTapSound();
      triggerVibration(25);

      sheetContent.innerHTML = `
        <div class="sheet-header-row">
          <span class="sheet-cat-badge" style="--cat-color: #8B5CF6">
            <span style="font-size: 1.15rem; line-height: 1;">🎭</span>
            <span>EVENIMENT CULTURAL • EDIȚIA XXXIII</span>
          </span>
          <button type="button" class="sheet-close-btn" id="sheet-close-btn" aria-label="Închide detaliile">
            ${icon('close', 18)}
          </button>
        </div>
        <div class="sheet-body-grid sheet-festival-grid">
          <div class="sheet-festival-thumbs-strip">
            <div class="festival-thumb-item" title="1. Afișul Festivalului Ediția XXXIII">
              <img src="./assets/canavoiu/1-afis-festival-canavoiu.jpg" alt="Afiș Festival Ion Cănăvoiu Ediția XXXIII" class="festival-thumb-img" />
              <span class="festival-thumb-num">1. Afiș</span>
            </div>
            <div class="festival-thumb-item" title="2. Portretul scriitorului Ion Cănăvoiu">
              <img src="./assets/canavoiu/2-portret-ion-canavoiu.jpg" alt="Portret de arhivă Ion Cănăvoiu" class="festival-thumb-img" />
              <span class="festival-thumb-num">2. Scriitor</span>
            </div>
            <div class="festival-thumb-item" title="3. Atelier de caricaturi în direct la Runcu">
              <img src="./assets/canavoiu/3-atelier-caricaturi-runcu.jpg" alt="Atelier caricatură Runcu" class="festival-thumb-img" />
              <span class="festival-thumb-num">3. Atelier Runcu</span>
            </div>
          </div>
          <div class="sheet-text-col">
            <h3 class="sheet-place-title">Festivalul Internațional de Umor și Caricatură „Ion Cănăvoiu”</h3>
            <p class="sheet-place-desc">
              Organizat anual la Runcu și Tg-Jiu în memoria scriitorului, poetului și epigramistului <strong>Ion Cănăvoiu</strong> (1939–1992), născut la Runcu. Evenimentul reunește peste 130 de creatori, concursuri de epigramă, grafică satirică și ateliere deschise de caricatură în aer liber la Runcu.
            </p>
          </div>
        </div>
        <div class="sheet-actions-row">
          <button type="button" class="btn-sheet-primary" id="btn-sheet-jump-festival" style="flex: 2;">
            ${icon('sparkles', 15)}
            <span>Vezi Secțiunea Dedicată din Pagină</span>
          </button>
          <a href="#/poveste/c-personalitate-locala" class="btn-sheet-secondary">
            ${icon('play', 15)}
            <span>Poveste &amp; Quiz</span>
          </a>
        </div>
      `;

      sheet.hidden = false;
      requestAnimationFrame(() => sheet.classList.add('is-open'));
      sheetContent.querySelector('#sheet-close-btn')?.addEventListener('click', closeSheet);
      sheetContent.querySelector('#btn-sheet-jump-festival')?.addEventListener('click', () => {
        closeSheet();
        const sec = document.querySelector('#festivalul-ion-canavoiu');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      });

      map.flyTo(festivalCoords, Math.max(map.getZoom(), 13), {
        duration: 0.6,
        easeLinearity: 0.25
      });
    }

    // Listen for custom event to focus festival marker from home view
    window.addEventListener('focus-festival-marker', () => {
      openFestivalSheet();
    });

    function closeSheet() {
      if (!activeId) return;
      activeId = null;
      sheet.classList.remove('is-open');
      setTimeout(() => { if (!activeId) sheet.hidden = true; }, 350);
    }

    // Filter Categories
    containerEl.querySelectorAll('.map-chip').forEach(chipBtn => {
      chipBtn.addEventListener('click', () => {
        playTapSound();
        containerEl.querySelectorAll('.map-chip').forEach(c => {
          const isActive = c === chipBtn;
          c.classList.toggle('is-active', isActive);
          c.setAttribute('aria-pressed', String(isActive));
        });

        currentCategory = chipBtn.dataset.cat;
        closeSheet();

        // Filter markers
        markerLayerMap.forEach(({ marker, wp }) => {
          if (currentCategory === 'ALL' || wp.category === currentCategory) {
            if (!markersGroup.hasLayer(marker)) markersGroup.addLayer(marker);
          } else {
            if (markersGroup.hasLayer(marker)) markersGroup.removeLayer(marker);
          }
        });

        // Toggle festival marker on ALL or C
        if (currentCategory === 'ALL' || currentCategory === 'C') {
          if (!markersGroup.hasLayer(festivalMarker)) markersGroup.addLayer(festivalMarker);
        } else {
          if (markersGroup.hasLayer(festivalMarker)) markersGroup.removeLayer(festivalMarker);
        }
      });
    });

    // Floating Controls
    containerEl.querySelector('#btn-zoom-in')?.addEventListener('click', () => {
      playTapSound();
      map.zoomIn();
    });

    containerEl.querySelector('#btn-zoom-out')?.addEventListener('click', () => {
      playTapSound();
      map.zoomOut();
    });

    containerEl.querySelector('#btn-reset-view')?.addEventListener('click', () => {
      playTapSound();
      closeSheet();
      map.fitBounds(runcuViewportBounds, { padding: [16, 16], maxZoom: 13 });
    });

    // Geolocation
    containerEl.querySelector('#btn-locate-me')?.addEventListener('click', () => {
      playTapSound();
      if (!('geolocation' in navigator)) {
        alert('Geolocalizarea nu este disponibilă pe acest dispozitiv.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;

          if (userMarker) map.removeLayer(userMarker);
          if (userAccuracy) map.removeLayer(userAccuracy);

          userAccuracy = L.circle([latitude, longitude], {
            radius: Math.max(accuracy, 20),
            color: '#3B82F6',
            weight: 1.5,
            fillColor: '#3B82F6',
            fillOpacity: 0.15
          }).addTo(map);

          userMarker = L.circleMarker([latitude, longitude], {
            radius: 8,
            color: '#FFFFFF',
            weight: 2,
            fillColor: '#3B82F6',
            fillOpacity: 0.95
          }).addTo(map);

          userMarker.bindTooltip('Ești aici', { permanent: false, direction: 'top' });
          map.flyTo([latitude, longitude], 14, { duration: 0.8 });
        },
        (err) => {
          console.warn('[GPS] Error:', err.message);
          alert('Nu s-a putut obține locația curentă. Verifică permisiunile GPS.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });

    // Explorer Compass — Points to closest uncollected waypoint
    const compassBadge = containerEl.querySelector('#map-compass-badge');
    containerEl.querySelector('#btn-map-compass')?.addEventListener('click', () => {
      playTapSound();
      if (!('geolocation' in navigator)) {
        alert('Busola necesită geolocalizare.');
        return;
      }

      const uncollected = waypoints.filter(w => !isStampUnlocked(w.id));
      if (uncollected.length === 0) {
        if (compassBadge) {
          compassBadge.hidden = false;
          compassBadge.innerHTML = `<span>${icon('checkCircle', 14)} Ai explorat toate cele 12 locuri din Runcu!</span>`;
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          let closest = null;
          let minDistance = Infinity;

          uncollected.forEach(wp => {
            const dist = calculateHaversineDistance(latitude, longitude, wp.coordinates[1], wp.coordinates[0]);
            if (dist < minDistance) {
              minDistance = dist;
              closest = wp;
            }
          });

          if (closest && compassBadge) {
            const { degrees, cardinal } = calculateBearing(latitude, longitude, closest.coordinates[1], closest.coordinates[0]);
            const distFormatted = minDistance >= 1000 ? `${(minDistance / 1000).toFixed(1)} km` : `${Math.round(minDistance)} m`;

            compassBadge.hidden = false;
            compassBadge.innerHTML = `
              <div class="compass-readout-row">
                <span class="compass-pointer-needle" style="transform: rotate(${degrees}deg);">➤</span>
                <span><strong>${distFormatted}</strong> spre <em>${closest.title.split('—')[0].trim().slice(0, 20)}</em> (${cardinal} • ${degrees}°)</span>
              </div>
            `;

            // Fly smoothly to fit user and target
            map.flyTo([closest.coordinates[1], closest.coordinates[0]], 13, { duration: 1.2 });
          }
        },
        (err) => {
          console.warn('[Compass] Error:', err);
          alert('Permisiunea GPS este necesară pentru orientarea busolei.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

    // Invalidate map size multiple times to ensure full dimensions are applied
    requestAnimationFrame(() => map.invalidateSize());
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 350);

    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
  };

  // Launch map initialization via requestIdleCallback so initial hero LCP remains 0.9s
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(initMap, { timeout: 650 });
  } else {
    setTimeout(initMap, 200);
  }
}
