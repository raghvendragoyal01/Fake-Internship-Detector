/* ═══════════════════════════════════════════════════════════════════════════
   Auth — Authentication state management, modal controls, and API calls.
   Manages login/signup flow, token persistence, and UI state sync.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api }            from './api.js';
import { showView }       from './navigation.js';
import { startDashboard } from './features.js';

/* ─── State ─────────────────────────────────────────────────────────────── */

const STORAGE_KEY  = 'scamshield_user';
let currentUser    = null;
let isSignupMode   = false;

export function getUser()    { return currentUser; }
export function isLoggedIn() { return currentUser !== null; }

/* ─── Initialisation ────────────────────────────────────────────────────── */

export function initAuth() {
  hydrateFromStorage();
  updateAuthUI();
  bindAuthEvents();
}

function hydrateFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    currentUser = JSON.parse(raw);
  } catch {
    currentUser = null;
    localStorage.removeItem(STORAGE_KEY);
  }
}

/* ─── UI Sync ───────────────────────────────────────────────────────────── */

export function updateAuthUI() {
  const landingView  = document.getElementById('landing-view');
  const appContainer = document.getElementById('app-container');
  const userInfo     = document.getElementById('userInfoSidebar');
  const userName     = document.getElementById('userNameDisplay');
  const authBtn      = document.getElementById('authBtn');

  if (currentUser) {
    landingView?.classList.add('hidden');
    appContainer?.classList.remove('app-container--hidden');

    if (userInfo) userInfo.classList.remove('hidden');
    if (authBtn)  authBtn.style.display = 'none';
    if (userName) userName.textContent = currentUser.name || currentUser.email;

    startDashboard();
  } else {
    landingView?.classList.remove('hidden');
    appContainer?.classList.add('app-container--hidden');

    if (userInfo) userInfo.classList.add('hidden');
    if (authBtn)  authBtn.style.display = 'block';
  }
}

/* ─── Modal ─────────────────────────────────────────────────────────────── */

export function toggleAuthModal(show) {
  const modal = document.getElementById('authModal');
  if (!modal) return;

  if (show) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    /* Force reflow so the CSS transition triggers */
    void modal.offsetWidth;
    modal.classList.add('modal-overlay--visible');
  } else {
    modal.classList.remove('modal-overlay--visible');
    setTimeout(() => {
      modal.style.display = 'none';
      modal.classList.add('hidden');
    }, 300);

    const errEl = document.getElementById('authError');
    if (errEl) errEl.classList.add('hidden');
  }
}

function switchAuthMode() {
  isSignupMode = !isSignupMode;

  setText('authTitle',    isSignupMode ? 'Create Account' : 'Welcome Back');
  setText('authSubtitle', isSignupMode ? 'Join ScamShield to report fraud' : 'Sign in to your ScamShield account');

  document.getElementById('authNameGroup')?.classList.toggle('hidden', !isSignupMode);
  setSpanText('authSubmitBtn', isSignupMode ? 'Sign Up' : 'Sign In');

  setText('authToggleText', isSignupMode ? 'Already have an account?' : "Don't have an account?");
  setText('authToggleBtn',  isSignupMode ? 'Sign in' : 'Sign up');

  document.getElementById('authError')?.classList.add('hidden');
}

/* ─── Auth Submit ───────────────────────────────────────────────────────── */

async function handleAuthSubmit(e) {
  e.preventDefault();

  const name     = val('authName');
  const email    = val('authEmail');
  const password = val('authPassword');
  const errBox   = document.getElementById('authError');
  const btn      = document.getElementById('authSubmitBtn');

  errBox?.classList.add('hidden');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }

  const payload = { email, password };
  if (isSignupMode) payload.name = name;

  try {
    const data = isSignupMode
      ? await api.signup(payload)
      : await api.login(payload);

    currentUser       = data.user;
    currentUser.token = data.token;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));

    updateAuthUI();
    toggleAuthModal(false);
    document.getElementById('authForm')?.reset();

    /* If user was trying to report before login, redirect */
    const reportView = document.getElementById('report-form-view');
    if (reportView?.dataset.pending === 'true') {
      delete reportView.dataset.pending;
      showView('report-form');
    }
  } catch (err) {
    if (errBox) {
      errBox.textContent = err.message;
      errBox.classList.remove('hidden');
    }
  } finally {
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem(STORAGE_KEY);
  updateAuthUI();
}

/* ─── Event Binding ─────────────────────────────────────────────────────── */

function bindAuthEvents() {
  on('accessPortalBtn', 'click', (e) => { e.preventDefault(); toggleAuthModal(true); });
  on('ctaJoinBtn',      'click', ()  => toggleAuthModal(true));
  on('authBtn',         'click', ()  => toggleAuthModal(true));
  on('closeAuthModal',  'click', ()  => toggleAuthModal(false));
  on('authToggleBtn',   'click', switchAuthMode);
  on('logoutBtn',       'click', handleLogout);

  document.getElementById('authForm')?.addEventListener('submit', handleAuthSubmit);

  /* Close modal on backdrop click */
  document.getElementById('authModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'authModal') toggleAuthModal(false);
  });
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function on(id, event, handler) {
  document.getElementById(id)?.addEventListener(event, handler);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setSpanText(id, text) {
  const el = document.getElementById(id);
  const span = el?.querySelector('span');
  if (span) span.textContent = text;
}
