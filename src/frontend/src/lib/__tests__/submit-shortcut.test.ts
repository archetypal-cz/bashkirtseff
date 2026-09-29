import { describe, it, expect } from 'vitest';
import { isApplePlatform, isSubmitShortcut, submitShortcutLabel } from '../submit-shortcut';
import { createT } from '../../i18n/astro';

const key = (over: Partial<KeyboardEvent> = {}) => ({
  key: 'Enter', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, isComposing: false, ...over,
});

describe('submit shortcut', () => {
  it('is Ctrl+Enter elsewhere and Cmd+Enter on Apple platforms', () => {
    expect(isSubmitShortcut(key({ ctrlKey: true }), false)).toBe(true);
    expect(isSubmitShortcut(key({ metaKey: true }), true)).toBe(true);
    expect(isSubmitShortcut(key({ metaKey: true }), false)).toBe(false);
    expect(isSubmitShortcut(key({ ctrlKey: true }), true)).toBe(false);
  });

  it('leaves plain Enter, other modifiers, other keys and IME composition alone', () => {
    expect(isSubmitShortcut(key(), false)).toBe(false);
    expect(isSubmitShortcut(key({ ctrlKey: true, shiftKey: true }), false)).toBe(false);
    expect(isSubmitShortcut(key({ ctrlKey: true, altKey: true }), false)).toBe(false);
    expect(isSubmitShortcut(key({ key: 'a', ctrlKey: true }), false)).toBe(false);
    expect(isSubmitShortcut(key({ ctrlKey: true, isComposing: true }), false)).toBe(false);
  });

  it('detects the platform and labels the keys', () => {
    expect(isApplePlatform({ platform: 'MacIntel' })).toBe(true);
    expect(isApplePlatform({ platform: '', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' })).toBe(true);
    expect(isApplePlatform({ platform: 'Linux x86_64' })).toBe(false);
    expect(isApplePlatform(undefined)).toBe(false);
    expect(submitShortcutLabel(false)).toBe('Ctrl+Enter');
    expect(submitShortcutLabel(true)).toBe('⌘+Enter');
  });

  it('has a localized hint in every UI language', () => {
    for (const locale of ['cs', 'en', 'fr', 'uk', 'es'] as const) {
      const hint = createT(locale)('report.submitShortcut', { keys: 'Ctrl+Enter' });
      expect(hint).toContain('Ctrl+Enter');
      expect(hint).not.toBe('report.submitShortcut');
    }
  });
});
