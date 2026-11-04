/**
 * Ambient Expedition Background
 * Static topographic isolines layer with slow drift + optional low-overhead canvas embers.
 * Pauses automatically when tab is hidden, reduced motion is requested, or on low-tier devices.
 */
import { isLowTierDevice, prefersReducedMotion } from '../tokens.js';

export function initAmbientBackground() {
  let root = document.getElementById('ambient-bg-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'ambient-bg-root';
    root.className = 'ambient-bg-root';
    root.setAttribute('aria-hidden', 'true');
    document.body.prepend(root);
  }

  root.innerHTML = `
    <!-- Topographic Contours Layer (Static SVG asset generated at build) -->
    <div class="ambient-topo-layer" id="ambient-topo-layer"></div>
    <!-- Mist / Horizon Vignette -->
    <div class="ambient-vignette-layer"></div>
    <!-- Canvas for Micro Embers / Motes -->
    <canvas class="ambient-particles-canvas" id="ambient-particles-canvas"></canvas>
  `;

  const canvas = root.querySelector('#ambient-particles-canvas');
  if (!canvas) return;

  // Adaptive Quality Check
  if (prefersReducedMotion() || isLowTierDevice()) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let animId = null;
  let isRunning = false;

  // Max 22 subtle embers
  const PARTICLE_COUNT = 20;
  const particles = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Capped DPR for low GPU load
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.scale(dpr, dpr);
  }

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(Math.random() * 0.3 + 0.1),
        alpha: Math.random() * 0.45 + 0.15,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function draw() {
    if (!isRunning) return;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.phase += p.pulseSpeed;

      // Wrap around bounds
      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 196, 94, ${currentAlpha.toFixed(2)})`;
      ctx.fill();
    }

    animId = requestAnimationFrame(draw);
  }

  function start() {
    if (!isRunning) {
      isRunning = true;
      animId = requestAnimationFrame(draw);
    }
  }

  function stop() {
    isRunning = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  // Lifecycle & Visibility Handling
  window.addEventListener('resize', () => {
    resize();
    initParticles();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  // Defer canvas particle startup until main thread is completely idle after FCP/LCP
  const deferInit = () => {
    resize();
    initParticles();
    start();
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(deferInit, { timeout: 1500 });
  } else {
    setTimeout(deferInit, 800);
  }
}
