/* ═══════════════════════════════════════════════════════════════════════════
   Animations — Scroll-triggered reveals, stat counters, and value animators
   Uses IntersectionObserver for performant scroll detection.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Initialise all scroll-based animations:
 *  - `.reveal` elements fade/slide in when entering the viewport
 *  - `.stat-counter` elements count up to their `data-target` value
 */
export function initScrollAnimations() {
  const reveals  = document.querySelectorAll('.reveal');
  const counters = document.querySelectorAll('.stat-counter');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        entry.target.classList.add('reveal--active');

        /* If the revealed element contains stat counters, animate them */
        const nestedCounters = entry.target.querySelectorAll('.stat-counter');
        nestedCounters.forEach(runCounter);
      }
    },
    { threshold: 0.15 }
  );

  reveals.forEach((el) => observer.observe(el));

  /* Also observe individual counters that aren't inside a .reveal */
  counters.forEach((counter) => {
    if (!counter.closest('.reveal')) {
      const singleObserver = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) runCounter(counter); },
        { threshold: 0.15 }
      );
      singleObserver.observe(counter);
    }
  });
}

/* ─── Counter Animation ─────────────────────────────────────────────────── */

/**
 * Animate a numeric counter element from 0 to its `data-target` value.
 * Prevents re-running by marking with a `data-counted` attribute.
 * @param {HTMLElement} counter
 */
function runCounter(counter) {
  if (counter.dataset.counted) return;
  counter.dataset.counted = 'true';

  const target   = parseInt(counter.dataset.target, 10) || 0;
  const duration = 2000; // ms
  const step     = Math.max(1, Math.floor(target / (duration / 16)));
  let current    = 0;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      counter.textContent = target.toLocaleString();
      clearInterval(timer);
    } else {
      counter.textContent = current.toLocaleString();
    }
  }, 16);
}

/* ─── Generic Value Animator ────────────────────────────────────────────── */

/**
 * Smoothly animate the text content of an element from `start` to `end`.
 * @param {string} elementId  - DOM id of the target element
 * @param {number} start      - Starting value
 * @param {number} end        - Ending value
 * @param {number} duration   - Animation duration in milliseconds
 */
export function animateValue(elementId, start, end, duration = 1500) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    el.textContent = Math.floor(progress * (end - start) + start);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
