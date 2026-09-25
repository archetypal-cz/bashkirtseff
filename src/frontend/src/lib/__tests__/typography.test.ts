import { describe, it, expect } from 'vitest';
import { applyTypography, quote, typographyLocaleFor } from '../typography';

const NNBSP = ' ';

describe('applyTypography — quotes per locale', () => {
  it('cs: closes a low opening quote typed with an ASCII close', () => {
    expect(applyTypography('Řekla: „Nedělejte to, Marie."', 'cs'))
      .toBe('Řekla: „Nedělejte to, Marie.“');
  });

  it('cs: straight pairs become „…“, nested ones ‚…‘', () => {
    expect(applyTypography('"Hraje se "Un ballo" dnes," řekla.', 'cs'))
      .toBe('„Hraje se ‚Un ballo‘ dnes,“ řekla.');
  });

  it('en: curly double quotes and apostrophes', () => {
    expect(applyTypography(`"It's Marie's," she said, 'The Meeting'.`, 'en'))
      .toBe('“It’s Marie’s,” she said, ‘The Meeting’.');
  });

  it('uk: straight pairs become «…», apostrophe inside a word becomes ʼ', () => {
    expect(applyTypography(`"М'ясо", сказала вона.`, 'uk')).toBe('«Мʼясо», сказала вона.');
  });

  it('es: «…» outside, “…” inside an already open «', () => {
    expect(applyTypography('«Dijo "sí" ayer»', 'es')).toBe('«Dijo “sí” ayer»');
  });

  it('fr: guillemets and narrow no-break spaces before ; : ! ?', () => {
    expect(applyTypography('Il dit : "Viens !" Quoi ? Oui ; non.', 'fr'))
      .toBe(`Il dit${NNBSP}: «${NNBSP}Viens${NNBSP}!${NNBSP}» Quoi${NNBSP}? Oui${NNBSP}; non.`);
  });

  it('fr: pads guillemets typed without spaces, leaves 10:30 alone', () => {
    expect(applyTypography('«Oui» à 10:30', 'fr')).toBe(`«${NNBSP}Oui${NNBSP}» à 10:30`);
  });

  it('fr: apostrophe', () => {
    expect(applyTypography("l'homme d'hier", 'fr')).toBe('l’homme d’hier');
  });
});

describe('applyTypography — HTML safety', () => {
  it('never touches attributes', () => {
    const html = '<a href="/cz/glossary/NICE/" class="x" title="a "b"">„Nice"</a>';
    const out = applyTypography(html, 'cs');
    expect(out.startsWith('<a href="/cz/glossary/NICE/" class="x" title="a "b"">')).toBe(true);
    expect(out.endsWith('„Nice“</a>')).toBe(true);
  });

  it('tracks quote state across inline tags', () => {
    expect(applyTypography('„<em>Aida</em>"', 'cs')).toBe('„<em>Aida</em>“');
    expect(applyTypography('<em>word</em>"', 'en')).toBe('<em>word</em>”');
  });

  it('leaves <code> contents and bare URLs verbatim', () => {
    expect(applyTypography('<code>"x" : y</code>', 'fr')).toBe('<code>"x" : y</code>');
    expect(applyTypography("See https://example.org/it's?a=1 now", 'en'))
      .toBe("See https://example.org/it's?a=1 now");
  });

  it('keeps footnote markup intact', () => {
    const html = '„Un ballo in maschera"<sup><a href="#fn-01.2.1" id="fnref-01.2.1" class="footnote-ref" aria-expanded="false">1</a></sup>';
    expect(applyTypography(html, 'cs')).toBe(html.replace('maschera"', 'maschera“'));
  });

  it('is idempotent on already-correct text', () => {
    const text = '„Ano,“ řekla. «Так» — l’homme';
    expect(applyTypography(text, 'cs')).toBe(text);
  });
});

describe('quote() and locale mapping', () => {
  it('wraps UI strings per locale', () => {
    expect(quote('x', 'cs')).toBe('„x“');
    expect(quote('x', 'uk')).toBe('«x»');
    expect(quote('x', 'en')).toBe('“x”');
    expect(quote('x', 'es')).toBe('«x»');
    expect(quote('x', 'fr')).toBe(`«${NNBSP}x${NNBSP}»`);
  });

  it('maps content paths', () => {
    expect(typographyLocaleFor('cz')).toBe('cs');
    expect(typographyLocaleFor('original')).toBe('fr');
    expect(typographyLocaleFor('_original')).toBe('fr');
    expect(typographyLocaleFor('uk')).toBe('uk');
  });
});

describe('cs inner low-9 quotes', () => {
  it('closes a typed ‚ with ‘ not ’', () => {
    expect(applyTypography("<p>„Řekl ‚ne' a odešel.“</p>", 'cs')).toBe('<p>„Řekl ‚ne‘ a odešel.“</p>');
  });
  it('keeps an elision apostrophe without an open ‚', () => {
    expect(applyTypography("<p>Vidělas' to?</p>", 'cs')).toBe('<p>Vidělas’ to?</p>');
  });
});
