import { describe, it, expect } from 'vitest';
import {
  hasInstalledRelatedApp,
  isRunningInstalled,
  readFlag,
  shouldShowInstallPrompt,
  writeFlag,
  type InstallPromptState,
} from '../install-prompt';

const media = (...modes: string[]) => (query: string) => ({
  matches: modes.some(m => query === `(display-mode: ${m})`),
});

describe('isRunningInstalled', () => {
  it('is false in a browser tab', () => {
    expect(isRunningInstalled({ matchMedia: media('browser'), navigator: {} })).toBe(false);
  });

  it.each(['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'])('is true in %s mode', mode => {
    expect(isRunningInstalled({ matchMedia: media(mode), navigator: {} })).toBe(true);
  });

  it('is true for an iOS home-screen app', () => {
    expect(isRunningInstalled({ matchMedia: media('browser'), navigator: { standalone: true } })).toBe(true);
  });

  it('survives a missing or throwing matchMedia', () => {
    expect(isRunningInstalled({})).toBe(false);
    expect(isRunningInstalled({ matchMedia: () => { throw new Error('no'); } })).toBe(false);
  });
});

describe('shouldShowInstallPrompt', () => {
  const base: InstallPromptState = {
    hasDeferredPrompt: true,
    runningInstalled: false,
    rememberedInstalled: false,
    relatedAppInstalled: false,
    dismissed: false,
  };

  it('shows only once beforeinstallprompt has fired and nothing says installed', () => {
    expect(shouldShowInstallPrompt(base)).toBe(true);
    expect(shouldShowInstallPrompt({ ...base, hasDeferredPrompt: false })).toBe(false);
  });

  it.each(['runningInstalled', 'rememberedInstalled', 'relatedAppInstalled', 'dismissed'] as const)(
    'hides when %s',
    key => expect(shouldShowInstallPrompt({ ...base, [key]: true })).toBe(false),
  );
});

describe('flags in storage', () => {
  it('remembers a flag and reads the legacy "true" value', () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    expect(readFlag(storage, 'pwa-installed')).toBe(false);
    writeFlag(storage, 'pwa-installed');
    expect(readFlag(storage, 'pwa-installed')).toBe(true);
    store.set('pwa-install-dismissed', 'true');
    expect(readFlag(storage, 'pwa-install-dismissed')).toBe(true);
  });

  it('treats missing or throwing storage as "not set"', () => {
    const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(readFlag(undefined, 'k')).toBe(false);
    expect(readFlag(throwing, 'k')).toBe(false);
    expect(() => writeFlag(throwing, 'k')).not.toThrow();
  });
});

describe('hasInstalledRelatedApp', () => {
  it('is true when the API lists our web app', async () => {
    await expect(hasInstalledRelatedApp({ getInstalledRelatedApps: async () => [{ platform: 'webapp', url: 'https://bashkirtseff.org/manifest.webmanifest' }] })).resolves.toBe(true);
  });

  it('is false when unsupported, empty or failing', async () => {
    await expect(hasInstalledRelatedApp({})).resolves.toBe(false);
    await expect(hasInstalledRelatedApp({ getInstalledRelatedApps: async () => [] })).resolves.toBe(false);
    await expect(hasInstalledRelatedApp({ getInstalledRelatedApps: async () => { throw new Error('x'); } })).resolves.toBe(false);
  });
});
