/* ═══════════════════════════════════════════════════════════════════════════
   Cursor — Custom blend-mode cursor with interactive hover states
   Visible on desktop only (≥1024 px). Hidden on touch devices.
   ═══════════════════════════════════════════════════════════════════════════ */

export function initCustomCursor() {
  const cursor = document.getElementById('custom-cursor');
  if (!cursor) return;

  /* Only activate on non-touch screens with enough width */
  const mediaQuery = window.matchMedia('(min-width: 1024px)');

  function activate() {
    if (!mediaQuery.matches) {
      cursor.classList.remove('custom-cursor--active');
      return;
    }

    cursor.classList.add('custom-cursor--active');

    document.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top  = `${e.clientY}px`;
    });

    /* Expand cursor when hovering interactive elements */
    document.querySelectorAll('.interactive-hover, .btn, a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('custom-cursor--hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('custom-cursor--hovering'));
    });
  }

  mediaQuery.addEventListener('change', activate);
  activate();
}
