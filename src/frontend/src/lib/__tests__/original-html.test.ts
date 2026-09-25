import { describe, it, expect } from 'vitest';
import { renderOriginalHtml } from '../original-html';

describe('renderOriginalHtml', () => {
  it('renders italics and bold instead of literal asterisks', () => {
    expect(renderOriginalHtml('Ce matin *je me suis plainte à maman* de **tout**.'))
      .toBe('Ce matin <em>je me suis plainte à maman</em> de <strong>tout</strong>.');
  });

  it('escapes raw HTML in the source', () => {
    expect(renderOriginalHtml('a <script>alert(1)</script> & b'))
      .toBe('a &lt;script&gt;alert(1)&lt;/script&gt; &amp; b');
    expect(renderOriginalHtml('<img src=x onerror=alert(1)>')).not.toContain('<img');
  });

  it('drops footnote refs and keeps link text only', () => {
    expect(renderOriginalHtml('Aida[^01.2.1] à [Nice](../_glossary/places/NICE.md).'))
      .toBe('Aida à Nice.');
  });

  it('marks foreign text', () => {
    expect(renderOriginalHtml('He said ==I love you== hier'))
      .toBe('He said <span class="foreign-text">I love you</span> hier');
  });

  it('renders a # date line as the chapter-head span', () => {
    expect(renderOriginalHtml('# Dimanche 29 août 1875\nIl fait beau.'))
      .toBe('<span class="original-date-heading">Dimanche 29 août 1875</span>Il fait beau.');
  });

  it('breaks before dialogue turns, rejoins soft wraps, gaps blank lines', () => {
    expect(renderOriginalHtml('Il dit\nqu’il viendra.\n— Oui ?\n— Non.\n\nFin.'))
      .toBe('Il dit qu’il viendra.<br>— Oui ?<br>— Non.<br><br>Fin.');
  });

  it('does not treat intra-word underscores as italics', () => {
    expect(renderOriginalHtml('snake_case_name and _italic_')).toBe('snake_case_name and <em>italic</em>');
  });
});
