/**
 * Application Configuration & External URLs
 * Project: Pașaportul Comunei Runcu — Lider European 2026
 */

export const APP_CONFIG = {
  appName: 'Pașaportul Comunei Runcu',
  appSubtitle: 'Lider European 2026 • Comuna Runcu, Jud. Gorj',
  
  // Deployment & Map links (can be overridden as needed)
  PASSPORT_URL: 'https://pasaport-runcu.web.app',
  MAP_URL: 'https://mapa-runcu.web.app',
  
  // Optional features
  verifyLocation: false, // Geolocation check disabled by default
  soundEnabled: true,    // Soft procedural audio enabled by default
  vibrationEnabled: true, // Haptic feedback on modern devices
  
  // Optional reward (empty/disabled until official partnership is established)
  reward: {
    enabled: false,
    text: '',
    partner: ''
  },
  
  // Local storage keys
  storageKey: 'pasaport_runcu_v1',
  demoStorageKey: 'pasaport_runcu_demo_v1'
};
