/* ═══════════════════════════════════════════════════════════════════════════
   ScamShield — Application Entry Point
   Orchestrates initialization of all modules in the correct sequence.
   ═══════════════════════════════════════════════════════════════════════════ */

import { injectSpeedInsights }   from '@vercel/speed-insights';
import { initParticleSystem }    from './modules/particles.js';
import { initCustomCursor }      from './modules/cursor.js';
import { initScrollAnimations }  from './modules/animations.js';
import { initAuth }              from './modules/auth.js';
import { initNavigation }        from './modules/navigation.js';
import { initFeatures }          from './modules/features.js';
import { initThreeJSBackground } from './modules/three_bg.js';

/**
 * Bootstrap the entire application once the DOM is ready.
 * Order matters: visual effects first, then logic layer.
 */
function bootstrap() {
  // Initialize Vercel Speed Insights
  injectSpeedInsights();
  
  initCustomCursor();
  initScrollAnimations();
  initParticleSystem();
  initThreeJSBackground();
  initAuth();
  initNavigation();
  initFeatures();
}

/* Run immediately — Vite injects the script as type="module" which
   defers execution until after HTML parsing, so DOMContentLoaded
   is guaranteed. */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
