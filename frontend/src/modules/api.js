/* ═══════════════════════════════════════════════════════════════════════════
   API — Centralized HTTP client for the ScamShield backend.
   All fetch calls are funneled through `api` to keep headers, base URL,
   and error handling consistent across the app.
   ═══════════════════════════════════════════════════════════════════════════ */

const API_BASE = import.meta.env.VITE_API_URL || window.API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Generic fetch wrapper.
 * @param {string}  endpoint  - URL path relative to API_BASE (e.g. "/analyze")
 * @param {object}  options   - Standard fetch init + optional `token` key
 * @returns {Promise<object>} - Parsed JSON response body
 * @throws {Error}            - On non-2xx or network failure
 */
async function request(endpoint, { method = 'GET', body, token, headers = {} } = {}) {
  const config = {
    method,
    headers: {
      ...headers,
    },
  };

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body instanceof FormData) {
    config.body = body;
    // Let the browser set the Content-Type with boundary
  } else if (body) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(body);
  }

  const res  = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.detail || data.error || 'Request failed');
  }

  return data;
}

/* ─── Public API methods ────────────────────────────────────────────────── */

export const api = {
  /** POST /auth/signup */
  signup: (payload) =>
    request('/auth/signup', { method: 'POST', body: payload }),

  /** POST /auth/login */
  login: (payload) =>
    request('/auth/login', { method: 'POST', body: payload }),

  /** GET /dashboard */
  dashboard: () =>
    request('/dashboard'),

  /** POST /analyze */
  analyzeScam: (payload) =>
    request('/analyze', { method: 'POST', body: payload }),

  /** GET /recruiter-check?email=...&domain=... */
  recruiterCheck: (params) =>
    request(`/recruiter-check?${new URLSearchParams(params).toString()}`),

  /** POST /report */
  reportScam: (payload, token) =>
    request('/report', { method: 'POST', body: payload, token }),

  /** POST /profile */
  saveProfile: (payload, token) =>
    request('/profile', { method: 'POST', body: payload, token }),

  /** POST /ats-analyze (FormData) */
  analyzeATS: (formData, token) =>
    request('/ats-analyze', { method: 'POST', body: formData, token }),
};
