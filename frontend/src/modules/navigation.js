/* ═══════════════════════════════════════════════════════════════════════════
   Navigation — Client-side view routing and sidebar/mobile-menu management.
   Uses data-view attributes on buttons to switch between view sections.
   ═══════════════════════════════════════════════════════════════════════════ */

import { isLoggedIn, toggleAuthModal } from './auth.js';
import { startDashboard, stopDashboard } from './features.js';

/* ─── View Map ──────────────────────────────────────────────────────────── */

const VIEW_IDS = {
  dashboard:                'dashboard-view',
  'scam-checker':           'scam-checker-view',
  'report-form':            'report-form-view',
  'profile-view':           'profile-view',
  'recruiter-verification': 'recruiter-verification-view',
};

/**
 * Switch the active view section and highlight the corresponding nav button.
 * @param {string} viewKey - Key from VIEW_IDS (e.g. "dashboard")
 */
export function showView(viewKey) {
  Object.entries(VIEW_IDS).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('view-hidden', key !== viewKey);
  });

  setActiveButton(viewKey);

  if (viewKey === 'dashboard') {
    startDashboard();
  } else {
    stopDashboard();
  }

  /* Collapse mobile menu on navigation */
  if (window.innerWidth < 1024) {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) mobileMenu.style.display = 'none';
  }
}

/* ─── Active Button ─────────────────────────────────────────────────────── */

function setActiveButton(viewKey) {
  document.querySelectorAll('.nav-btn, .nav-btn-mobile').forEach((btn) => {
    const isActive = btn.dataset.view === viewKey;
    btn.classList.toggle('sidebar-active', isActive);
  });
}

/* ─── Initialisation ────────────────────────────────────────────────────── */

export function initNavigation() {
  /* Sidebar & mobile nav buttons */
  document.querySelectorAll('.nav-btn, .nav-btn-mobile, .nav-cta').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.view;
      if (!target) return;

      /* Gate report form behind auth */
      if (target === 'report-form' && !isLoggedIn()) {
        document.getElementById('report-form-view').dataset.pending = 'true';
        toggleAuthModal(true);
        return;
      }

      showView(target);
    });
  });

  /* Mobile menu toggle */
  document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    const menu = document.getElementById('mobileMenu');
    if (!menu) return;
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  });

  /* Default view */
  showView('dashboard');
}
