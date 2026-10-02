/**
 * When to offer "install the app" (InstallPrompt.vue).
 *
 * The banner needs a captured `beforeinstallprompt` event, which only
 * Chromium browsers fire, and which they are meant to skip once the app is
 * installed. That is not reliable across browser profiles, a second browser
 * or a fresh tab racing the install, so we also refuse when:
 *  - the page itself runs as the installed app (any app display mode, or
 *    iOS `navigator.standalone`);
 *  - this browser saw `appinstalled` earlier (remembered in localStorage);
 *  - `navigator.getInstalledRelatedApps()` reports this site's own web app
 *    (manifest `related_applications`, platform "webapp");
 *  - the reader dismissed the banner before.
 * iOS has no `beforeinstallprompt`, so it never shows there.
 */

export const DISMISSED_KEY = 'pwa-install-dismissed';
export const INSTALLED_KEY = 'pwa-installed';

/** Display modes in which the page is running as an installed app. */
export const APP_DISPLAY_MODES = ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'] as const;

export interface InstallEnvironment {
  matchMedia?: (query: string) => { matches: boolean };
  navigator?: { standalone?: boolean };
}

export function isRunningInstalled(env: InstallEnvironment): boolean {
  if (env.navigator?.standalone === true) return true;
  const matchMedia = env.matchMedia;
  if (!matchMedia) return false;
  return APP_DISPLAY_MODES.some(mode => {
    try {
      return matchMedia(`(display-mode: ${mode})`).matches;
    } catch {
      return false;
    }
  });
}

export interface InstallPromptState {
  runningInstalled: boolean;   // isRunningInstalled()
  rememberedInstalled: boolean; // appinstalled seen earlier in this browser
  relatedAppInstalled: boolean; // getInstalledRelatedApps() found our app
  dismissed: boolean;           // reader said "no thanks"
  hasDeferredPrompt: boolean;   // beforeinstallprompt has fired
}

export function shouldShowInstallPrompt(s: InstallPromptState): boolean {
  return s.hasDeferredPrompt
    && !s.runningInstalled
    && !s.rememberedInstalled
    && !s.relatedAppInstalled
    && !s.dismissed;
}

/** localStorage can be absent or throw (private mode, blocked storage). */
export function readFlag(storage: Pick<Storage, 'getItem'> | undefined, key: string): boolean {
  try {
    return storage?.getItem(key) != null;
  } catch {
    return false;
  }
}

export function writeFlag(storage: Pick<Storage, 'setItem'> | undefined, key: string): void {
  try {
    storage?.setItem(key, new Date().toISOString());
  } catch {
    // Not remembered: the in-memory state still hides the banner this visit.
  }
}

interface RelatedApp { platform?: string; url?: string; id?: string }

/**
 * Whether getInstalledRelatedApps() lists this site's web app. False where
 * the API is missing (Firefox, Safari) or fails.
 */
export async function hasInstalledRelatedApp(
  nav: { getInstalledRelatedApps?: () => Promise<RelatedApp[]> } | undefined,
): Promise<boolean> {
  if (typeof nav?.getInstalledRelatedApps !== 'function') return false;
  try {
    const apps = await nav.getInstalledRelatedApps();
    return apps.some(app => app.platform === 'webapp');
  } catch {
    return false;
  }
}
