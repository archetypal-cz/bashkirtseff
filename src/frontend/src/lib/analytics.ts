// ─── Analytics Abstraction Layer ─────────────────────────────────────
//
// Provider-swappable analytics. Currently backed by Umami.
// To switch providers: replace the provider implementation below
// and swap the <script> tag in BaseLayout.astro. All trackEvent()
// calls across components stay identical.
//
// Usage:
//   import { trackEvent } from '../lib/analytics';
//   trackEvent('theme_change', { theme: 'dark' });

// ─── Types ───────────────────────────────────────────────────────────

interface AnalyticsProvider {
  track(name: string, data?: Record<string, string | number | boolean>): void;
}

interface GlobalProperties {
  pwa: boolean;
}

// ─── PWA Detection ───────────────────────────────────────────────────

let _globals: GlobalProperties | null = null;

function getGlobalProperties(): GlobalProperties {
  if (_globals) return _globals;

  let pwa = false;
  if (typeof window !== 'undefined') {
    pwa = window.matchMedia('(display-mode: standalone)').matches;
    // iOS Safari standalone mode (older WebKit)
    if (!pwa && (navigator as any).standalone === true) {
      pwa = true;
    }
  }

  _globals = { pwa };
  return _globals;
}

// ─── Umami Provider ──────────────────────────────────────────────────

const umamiProvider: AnalyticsProvider = {
  track(name, data) {
    const umami = (window as any).umami;
    if (typeof umami?.track !== 'function') return;
    umami.track(name, { ...getGlobalProperties(), ...data });
  },
};

// ─── Active Provider ─────────────────────────────────────────────────

let _provider: AnalyticsProvider = umamiProvider;

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Track a named event with optional properties.
 * Safe to call from any context (SSR, Astro scripts, Vue components).
 * If the provider isn't loaded, calls are silently ignored.
 * Every event automatically includes { pwa: boolean }.
 */
export function trackEvent(
  name: string,
  data?: Record<string, string | number | boolean>,
): void {
  if (typeof window === 'undefined') return;
  try {
    _provider.track(name, data);
  } catch {
    // Never let analytics break the app
  }
}

/**
 * Initialize analytics. Currently a no-op (global properties are
 * detected lazily). Reserved for providers that need async setup.
 */
export function initAnalytics(): void {
  getGlobalProperties();
}

/**
 * Replace the active analytics provider (for testing or swapping).
 */
export function setAnalyticsProvider(provider: AnalyticsProvider): void {
  _provider = provider;
}
