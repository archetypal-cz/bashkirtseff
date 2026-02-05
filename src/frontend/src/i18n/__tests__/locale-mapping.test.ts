/**
 * Tests for locale to content path mapping
 *
 * Verifies that the mapping between UI locale codes (cs, fr, en) and
 * content path codes (cz, fr, en) works correctly.
 */

import { describe, it, expect } from 'vitest';
import { localeToContentPath, contentPathToLocale, type SupportedLocale } from '../index';

describe('Locale to Content Path Mapping', () => {
  describe('localeToContentPath', () => {
    it('converts Czech locale to cz content path', () => {
      expect(localeToContentPath('cs')).toBe('cz');
    });

    it('keeps French locale as fr content path', () => {
      expect(localeToContentPath('fr')).toBe('fr');
    });

    it('keeps English locale as en content path', () => {
      expect(localeToContentPath('en')).toBe('en');
    });

    it('handles all supported locales', () => {
      const locales: SupportedLocale[] = ['cs', 'fr', 'en'];
      const expected = ['cz', 'fr', 'en'];

      locales.forEach((locale, i) => {
        expect(localeToContentPath(locale)).toBe(expected[i]);
      });
    });
  });

  describe('contentPathToLocale', () => {
    it('converts cz content path to Czech locale', () => {
      expect(contentPathToLocale('cz')).toBe('cs');
    });

    it('keeps fr content path as French locale', () => {
      expect(contentPathToLocale('fr')).toBe('fr');
    });

    it('keeps en content path as English locale', () => {
      expect(contentPathToLocale('en')).toBe('en');
    });

    it('handles all content paths', () => {
      const paths = ['cz', 'fr', 'en'];
      const expected: SupportedLocale[] = ['cs', 'fr', 'en'];

      paths.forEach((path, i) => {
        expect(contentPathToLocale(path)).toBe(expected[i]);
      });
    });
  });

  describe('Round-trip conversion', () => {
    it('correctly round-trips Czech locale', () => {
      const locale: SupportedLocale = 'cs';
      const path = localeToContentPath(locale);
      const backToLocale = contentPathToLocale(path);

      expect(path).toBe('cz');
      expect(backToLocale).toBe('cs');
    });

    it('correctly round-trips all locales', () => {
      const locales: SupportedLocale[] = ['cs', 'fr', 'en'];

      locales.forEach(locale => {
        const path = localeToContentPath(locale);
        const backToLocale = contentPathToLocale(path);
        expect(backToLocale).toBe(locale);
      });
    });
  });

  describe('URL building scenarios', () => {
    it('builds correct Czech diary URL from locale', () => {
      const uiLocale: SupportedLocale = 'cs';
      const contentPath = localeToContentPath(uiLocale);
      const url = `/${contentPath}/002/1873-08-11`;

      expect(url).toBe('/cz/002/1873-08-11');
    });

    it('builds correct URLs for all locales', () => {
      const locales: SupportedLocale[] = ['cs', 'fr', 'en'];
      const expectedUrls = [
        '/cz/002/1873-08-11',
        '/fr/002/1873-08-11',
        '/en/002/1873-08-11',
      ];

      locales.forEach((locale, i) => {
        const contentPath = localeToContentPath(locale);
        const url = `/${contentPath}/002/1873-08-11`;
        expect(url).toBe(expectedUrls[i]);
      });
    });
  });

  describe('localStorage scenarios', () => {
    it('uses locale code for localStorage, not content path', () => {
      // User selects Czech in UI
      const uiLocale: SupportedLocale = 'cs';

      // This should be stored in localStorage
      const storageValue = uiLocale; // 'cs', not 'cz'

      // When building content URL, convert to content path
      const contentPath = localeToContentPath(uiLocale);

      expect(storageValue).toBe('cs'); // localStorage uses locale
      expect(contentPath).toBe('cz');   // URLs use content path
    });
  });
});
