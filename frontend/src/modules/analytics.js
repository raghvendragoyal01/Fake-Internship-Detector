/* ═══════════════════════════════════════════════════════════════════════════
   ScamShield — Vercel Web Analytics Module
   Initializes Vercel Web Analytics for tracking page views and user interactions.
   ═══════════════════════════════════════════════════════════════════════════ */

import { inject } from '@vercel/analytics';

/**
 * Initialize Vercel Web Analytics
 * Automatically tracks page views and provides analytics data in Vercel dashboard
 */
export function initAnalytics() {
  // Inject Vercel Analytics script
  inject();
}
