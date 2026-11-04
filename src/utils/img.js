/**
 * Responsive image helper: AVIF/WebP <picture> with fixed dimensions
 * (zero CLS), dominant-colour placeholder and lazy loading.
 */

const escapeAttr = (s = '') => String(s).replace(/"/g, '&quot;');

export function picture(meta, { alt = '', sizes = '100vw', eager = false, className = '', fallbackSrc = '' } = {}) {
  if (!meta || !meta.srcsetWebp) {
    const src = meta?.src || fallbackSrc;
    return `<img src="${src}" alt="${escapeAttr(alt)}" class="${className}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" />`;
  }
  return `
    <picture class="pic" style="background-color: ${meta.color || '#0E1814'}">
      <source type="image/avif" srcset="${meta.srcsetAvif}" sizes="${sizes}" />
      <source type="image/webp" srcset="${meta.srcsetWebp}" sizes="${sizes}" />
      <img src="${meta.src}" width="${meta.width}" height="${meta.height}" alt="${escapeAttr(alt)}"
           class="${className}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"
           ${eager ? 'fetchpriority="high"' : ''} />
    </picture>`;
}
