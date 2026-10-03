/**
 * Bracketed manuscript markers ([Rayé: x], [Na okraji: x], …): lib/text-markers.ts
 */
import { describe, it, expect } from 'vitest';
import {
  classifyMarkPrefix, htmlToPlainText, markAt, marksToPlainText, renderMarks, replaceMarks, unwrapWholeMark,
} from '../text-markers';
import { renderOriginalHtml } from '../original-html';
import { plainText } from '../paragraph-index';

describe('classifyMarkPrefix', () => {
  it('classifies the prefixes of every tree by keyword, variants and typos included', () => {
    for (const p of ['Rayé', 'Raye', 'Škrtnuto', 'Crossed out', 'Викреслено', 'Deux lignes cancellées', 'Zrušeny 2 řádky', 'Barré', 'Tachado', 'Rayé et noirci']) {
      expect(classifyMarkPrefix(p), p).toBe('struck');
    }
    for (const p of ['Mots noircis', 'Mot noirci', 'Mots noiricis', 'Začerněná slova', 'words blacked out', 'Замазано', 'затерті слова']) {
      expect(classifyMarkPrefix(p), p).toBe('blacked');
    }
    for (const p of ['Dans la marge', 'Na okraji', 'In the margin', 'На полях', 'En el margen', 'In the margin, crosswise']) {
      expect(classifyMarkPrefix(p), p).toBe('margin');
    }
    for (const p of ['En travers', 'Napříč stránkou', 'Written across the page', 'Навскоси', 'Упоперек', 'Escrito de través en la página']) {
      expect(classifyMarkPrefix(p), p).toBe('across');
    }
    for (const p of ['Annotation', 'Poznámka', 'Page intercalée', 'Note de l\'éd.', 'Prayer']) {
      expect(classifyMarkPrefix(p), p).toBeNull();
    }
  });
});

describe('markAt / replaceMarks', () => {
  it('balances nested brackets, multi-line markers, and leaves unclosed or unknown ones alone', () => {
    const text = 'a [Rayé: x [^1] y] b';
    expect(markAt(text, 2)).toMatchObject({ type: 'struck', prefix: 'Rayé', close: text.length - 3 });
    expect(markAt('[Rayé: Ma tête\nEt cependant I]', 0)?.close).toBe(29);
    expect(markAt('[Rayé: jamais fermé', 0)).toBeNull();
    expect(markAt('[Annotation: 1877. Toujours !!]', 0)).toBeNull();
    expect(markAt('[^01.2.3]', 0)).toBeNull();
    expect(markAt('[#Nice](../NICE.md)', 0)).toBeNull();
    expect(markAt('[Rayé : avec espace]', 0)?.prefix).toBe('Rayé');
    expect(replaceMarks('[Rayé: a [Mot noirci: b] c]', (t, i) => `<${t}>${i}</${t}>`)).toBe('<struck>a <blacked>b</blacked> c</struck>');
  });
});

describe('renderMarks', () => {
  it('struck and blacked-out words: <del> of the words, the label only as a tooltip', () => {
    expect(renderMarks('un [Rayé: exploit] acte', 'original'))
      .toBe('un <del class="mark mark-struck" data-mark="struck" title="rayé">exploit</del> acte');
    expect(renderMarks('[words blacked out: two days]', 'en'))
      .toBe('<del class="mark mark-blacked" data-mark="blacked" title="blacked out">two days</del>');
  });

  it('margin and across notes keep a small label in the content language', () => {
    expect(renderMarks('[Dans la marge: note]', 'cz'))
      .toBe('<span class="mark mark-margin" data-mark="margin"><span class="mark-label">na okraji</span> note</span>');
    expect(renderMarks('[Навскоси: x]', 'uk')).toContain('<span class="mark-label">навскоси</span>');
  });
});

describe('unwrapWholeMark', () => {
  it('finds a paragraph that is one marker plus footnote refs, and nothing else', () => {
    const html = renderMarks('[Rayé: a [Mot noirci: b] c]', 'original') + '<sup><a href="#fn-1">1</a></sup>';
    expect(unwrapWholeMark(html)).toEqual({
      type: 'struck',
      inner: 'a <del class="mark mark-blacked" data-mark="blacked" title="noirci">b</del> c',
      rest: '<sup><a href="#fn-1">1</a></sup>',
    });
    expect(unwrapWholeMark(renderMarks('[Na okraji: x]', 'cz'))).toEqual({ type: 'margin', inner: 'x', rest: '' });
    expect(unwrapWholeMark(renderMarks('[Rayé: a] et b', 'original'))).toBeNull();
    expect(unwrapWholeMark('texte')).toBeNull();
  });
});

describe('plain-text consumers', () => {
  it('previews and snippets drop struck words, keep margin notes, keep a whole struck passage', () => {
    expect(marksToPlainText('un brillant [Rayé: exploit] acte [Dans la marge: vu]')).toBe('un brillant acte vu');
    expect(marksToPlainText('[Rayé: Samedi 9 octobre 1875]')).toBe('Samedi 9 octobre 1875');
    expect(plainText('%% [Rayé: x] %%\nUn brillant [Škrtnuto: čin] skutek.')).toBe('Un brillant skutek.');
  });

  it('meta text from HTML loses kind labels, mark labels and struck words', () => {
    const html = '<div class="para-kind para-kind-margin"><span class="para-kind-label para-kind-label-mini"><span class="para-kind-name">na okraji</span><span class="para-kind-sep" aria-hidden="true"> · </span><cite class="para-kind-source">x</cite></span><div class="para-kind-body">Text <del class="mark mark-struck" data-mark="struck" title="škrtnuto">čin</del> skutek<sup><a>1</a></sup>.</div></div>';
    expect(htmlToPlainText(html)).toBe('Text skutek.');
  });

  it('closes the hole only where struck words went: French spacing elsewhere stays', () => {
    expect(marksToPlainText('Ah ! un [Rayé: x], acte ; fin [Rayé: y]')).toBe('Ah ! un, acte ; fin');
    expect(marksToPlainText('[Rayé: x] Début')).toBe('Début');
    expect(htmlToPlainText('Ah ! un <del class="mark mark-struck" data-mark="struck">x</del>, acte ?')).toBe('Ah ! un, acte ?');
    // nested struck spans go whole
    expect(htmlToPlainText('a <del class="mark mark-struck" data-mark="struck">b <del class="mark mark-blacked" data-mark="blacked">c</del> d</del> e')).toBe('a e');
  });

  it('the French face renders markers across lines, escaped, without sentinels', () => {
    const html = renderOriginalHtml('Avant [Rayé: Ma tête <b>\nEt cependant] après [Dans la marge: vu]');
    expect(html).toBe('Avant <del class="mark mark-struck" data-mark="struck" title="rayé">Ma tête &lt;b&gt; Et cependant</del> après <span class="mark mark-margin" data-mark="margin"><span class="mark-label">dans la marge</span> vu</span>');
    expect(html).not.toMatch(/[\u0001\u0002]/);
  });
});
