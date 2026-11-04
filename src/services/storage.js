/**
 * Versioned Local Storage Service with In-Memory Fallback & Demo Mode Isolation
 */

import { APP_CONFIG } from '../config.js';

let memoryStore = {
  real: null,
  demo: null
};

const listeners = new Set();

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('[Storage] Listener error:', e);
    }
  });
}

export function isDemoMode() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash || '';
  return params.get('demo') === '1' || hash.includes('demo=1') || sessionStorage.getItem('runcu_demo_active') === '1';
}

export function setDemoMode(active) {
  if (typeof window === 'undefined') return;
  if (active) {
    sessionStorage.setItem('runcu_demo_active', '1');
  } else {
    sessionStorage.removeItem('runcu_demo_active');
  }
  notifyListeners();
}

function getActiveKey() {
  return isDemoMode() ? APP_CONFIG.demoStorageKey : APP_CONFIG.storageKey;
}

function createDefaultState() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    userName: '',
    unlocked: {}
  };
}

export function getPassportData() {
  const key = getActiveKey();
  const demo = isDemoMode();

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.unlocked) {
        return parsed;
      }
    }
  } catch {
    // LocalStorage unavailable, use in-memory
    const memKey = demo ? 'demo' : 'real';
    if (memoryStore[memKey]) return memoryStore[memKey];
  }

  // Do not persist/notify here: reading must never trigger re-renders.
  const memKey = demo ? 'demo' : 'real';
  if (!memoryStore[memKey]) memoryStore[memKey] = createDefaultState();
  return memoryStore[memKey];
}

export function savePassportData(data) {
  const key = getActiveKey();
  const demo = isDemoMode();

  // Always mirror in memory; localStorage may be unavailable (private mode).
  const memKey = demo ? 'demo' : 'real';
  memoryStore[memKey] = data;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // In-memory fallback already applied
  }

  notifyListeners();
}

export function isStampUnlocked(id) {
  const data = getPassportData();
  return Boolean(data.unlocked && data.unlocked[id]);
}

export function getStampUnlockInfo(id) {
  const data = getPassportData();
  return data.unlocked?.[id] || null;
}

export function unlockStamp(id, { verified = false, method = 'qr' } = {}) {
  const data = getPassportData();
  if (data.unlocked[id]) {
    return { alreadyUnlocked: true, info: data.unlocked[id] };
  }

  const now = new Date();
  const formattedDate = now.toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const record = {
    unlockedAt: now.toISOString(),
    timestamp: now.getTime(),
    dateFormatted: formattedDate,
    timeFormatted: formattedTime,
    verified: Boolean(verified),
    method
  };

  data.unlocked[id] = record;
  savePassportData(data);

  return { alreadyUnlocked: false, info: record };
}

export function getJournalNotes() {
  const data = getPassportData();
  return data.journalNotes || {};
}

export function saveJournalNote(stampId, noteText) {
  const data = getPassportData();
  if (!data.journalNotes) data.journalNotes = {};
  data.journalNotes[stampId] = {
    text: (noteText || '').trim(),
    updatedAt: new Date().toISOString()
  };
  savePassportData(data);
}

export function setUserName(name) {
  const data = getPassportData();
  data.userName = (name || '').trim().slice(0, 50);
  savePassportData(data);
}

export function getUserName() {
  const data = getPassportData();
  return data.userName || '';
}

export function resetPassport() {
  const key = getActiveKey();
  const demo = isDemoMode();

  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }

  const memKey = demo ? 'demo' : 'real';
  memoryStore[memKey] = null;

  savePassportData(createDefaultState());
}

export function subscribeToStorage(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
