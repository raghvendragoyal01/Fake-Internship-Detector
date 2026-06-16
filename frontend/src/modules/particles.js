/* ═══════════════════════════════════════════════════════════════════════════
   Particles — Starfield warp-speed canvas animation
   Creates an immersive deep-space background with parallax star movement.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Initialises the particle canvas on both the landing page and
 * the portal background. Automatically adapts to viewport resizes.
 */
export function initParticleSystem() {
  createStarfield('particleCanvas');
  createStarfield('portalParticleCanvas');
}

/* ─── Starfield Factory ─────────────────────────────────────────────────── */

function createStarfield(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let stars = [];
  let animationId = null;

  /** Single star with depth (z-axis). */
  class Star {
    constructor() { this.reset(); }

    reset() {
      this.x    = Math.random() * width;
      this.y    = Math.random() * height;
      this.z    = Math.random() * width;
      this.size = Math.random() * 1.5 + 0.5;
    }

    update() {
      this.z -= 1.5;
      if (this.z <= 0) {
        this.reset();
        this.z = width;
      }
    }

    draw() {
      const factor = width / this.z;
      const x = (this.x - width / 2) * factor + width / 2;
      const y = (this.y - height / 2) * factor + height / 2;
      const r = Math.max(0.1, this.size * factor);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, 1 - this.z / width)})`;
      ctx.fill();
    }
  }

  function resize() {
    width  = canvas.width  = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    stars = [];
    const count = window.innerWidth < 768 ? 60 : 180;
    for (let i = 0; i < count; i++) {
      stars.push(new Star());
    }
  }

  function animate() {
    ctx.fillStyle = 'hsl(218, 80%, 3%)';
    ctx.fillRect(0, 0, width, height);

    for (const star of stars) {
      star.update();
      star.draw();
    }

    animationId = requestAnimationFrame(animate);
  }

  /* ─── Lifecycle ──────────────────────────────────────────────────────── */
  window.addEventListener('resize', () => {
    if (animationId) cancelAnimationFrame(animationId);
    init();
    animate();
  });

  init();
  animate();
}
