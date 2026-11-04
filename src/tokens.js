/**
 * Design System Tokens — „Jurnal de Expediție”
 * Project: Pașaportul Runcului • Lider European 2026
 * Tactile paper textures, deep obsidian night, gold leaf foil, and authentic category inks.
 */

export const THEME_TOKENS = {
  colors: {
    // Backgrounds — Deep Obsidian Carpathian Pine & Velvety Slate
    bgVoid: '#050908',
    bgObsidian: '#090E0D',
    bgElevated: '#111815',
    bgPanel: '#15201C',
    bgGlass: 'rgba(12, 20, 17, 0.86)',

    // Warm Expedition Paper Pages (Vellum & Linen)
    paperCream: '#F6F1E6',
    paperTint: '#EFE8DA',
    paperEdge: '#DECDB8',
    paperText: '#1E1B18',
    paperTextMuted: '#5C554B',
    paperBorder: 'rgba(30, 27, 24, 0.12)',

    // Metallic Gold Leaf Accents (Antique Imperial Gold)
    goldFoil: '#D8A24A',
    goldFoilBright: '#F5D37E',
    goldFoilDeep: '#A87627',
    goldFoilGlow: 'rgba(216, 162, 74, 0.28)',

    // Inks on Paper (Categories A–D) — Rich Heritage Mineral Inks
    inkA: '#198764', // Alpine Spruce / Smarald Vâlcan
    inkB: '#BF572B', // Terracotta Clay / Lut Gorjenesc
    inkC: '#C28B1E', // Amber Sunstone / Chihlimbar Voievodal
    inkD: '#744E94'  // Highland Heather / Ametist Nocturn
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  radii: {
    sm: '8px',
    md: '14px',
    lg: '20px',
    booklet: '28px',
    pill: '999px'
  },
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.35)',
    paper: '0 8px 30px rgba(0, 0, 0, 0.45), 0 1px 0 rgba(255, 255, 255, 0.08) inset',
    booklet: '0 24px 60px rgba(0, 0, 0, 0.75), 0 2px 0 rgba(216, 162, 74, 0.3) inset',
    emboss: 'inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.08)'
  }
};

export const CATEGORY_META = {
  A: {
    id: 'A',
    color: '#198764',
    glow: 'rgba(25, 135, 100, 0.45)',
    bgSubtle: 'rgba(25, 135, 100, 0.14)',
    labelRo: 'Obiective turistice',
    descRo: 'Naturale, locuri de interes, belvedere, trasee și zone de vizitare',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/><path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19"/></svg>`
  },
  B: {
    id: 'B',
    color: '#BF572B',
    glow: 'rgba(191, 87, 43, 0.45)',
    bgSubtle: 'rgba(191, 87, 43, 0.14)',
    labelRo: 'Tradiții și obiceiuri',
    descRo: 'Sărbători, tradiții de comunitate, port popular, preparate și meșteșuguri',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 15 8l6 3-6 3-3 6-3-6-6-3 6-3 3-6z"/><circle cx="12" cy="11" r="2"/></svg>`
  },
  C: {
    id: 'C',
    color: '#C28B1E',
    glow: 'rgba(194, 139, 30, 0.45)',
    bgSubtle: 'rgba(194, 139, 30, 0.14)',
    labelRo: 'Personalități locale',
    descRo: 'Oameni care au contribuit la comunitate, oameni de cultură, meșteri populari',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polygon points="19 8 20.2 10.5 23 10.9 21 12.8 21.5 15.5 19 14.2 16.5 15.5 17 12.8 15 10.9 17.8 10.5 19 8"/></svg>`
  },
  D: {
    id: 'D',
    color: '#744E94',
    glow: 'rgba(116, 78, 148, 0.45)',
    bgSubtle: 'rgba(116, 78, 148, 0.14)',
    labelRo: 'Poveștile comunității',
    descRo: 'Legende, amintiri ale localnicilor, povești despre locuri, mărturii intergeneraționale',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
  }
};

export const MOTION_TOKENS = {
  duration: {
    micro: 0.18,
    ui: 0.45,
    page: 0.55,
    stamp: 0.72,
    camera: 1.2
  },
  ease: {
    expoOut: 'expo.out',
    spring: 'back.out(1.6)',
    stampOvershoot: 'back.out(2.2)',
    pageTurn: 'power2.inOut'
  }
};

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Checks if the device has low performance capabilities
 * (hardwareConcurrency <= 4 or deviceMemory <= 4)
 */
export function isLowTierDevice() {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  return cores <= 2 || memory <= 2;
}
