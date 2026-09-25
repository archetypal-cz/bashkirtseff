import { describe, it, expect } from 'vitest';
import { monthName, weekdayLabels } from '../calendar-labels';
import { languageTitle, languageSymbol } from '../language-labels';

describe('calendar labels', () => {
  it('month names follow the UI locale', () => {
    expect(monthName(1, 'cs')).toBe('Leden');
    expect(monthName(1, 'en')).toBe('January');
    expect(monthName(5, 'fr')).toBe('Mai');
    expect(monthName(1, 'uk')).toBe('Січень');
  });

  it('weekday labels start on Monday', () => {
    expect(weekdayLabels('cs')).toEqual(['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']);
    expect(weekdayLabels('en')).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
    expect(weekdayLabels('uk')[0]).toBe('Пн');
  });
});

describe('language labels', () => {
  it('names the language in the reader’s UI language', () => {
    expect(languageTitle('fr', 'en')).toBe('French');
    expect(languageTitle('fr', 'cs')).toBe('francouzština');
    expect(languageTitle('cz', 'en')).toBe('Czech');
  });

  it('keeps the icon glyphs', () => {
    expect(languageSymbol('fr')).toBe('⚜');
    expect(languageSymbol('xx')).toBe('XX');
  });
});
