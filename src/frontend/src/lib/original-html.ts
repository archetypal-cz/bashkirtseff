/**
 * Render the French original shown on the back of a flipped paragraph.
 *
 * The source is the raw markdown of an `_original` paragraph (or the copy
 * embedded in a translation file). It used to be printed as plain text, so
 * Marie's underlinings (`*…*`) showed as literal asterisks. This renders the
 * same inline markdown as the translation face, but safely: the text is
 * HTML-escaped first, and only the markup produced here reaches the page.
 *
 *   # Heading / ## Sub-heading   → date line styled as a chapter head
 *   **bold**, *italic*, _italic_ → <strong>, <em>
 *   ==foreign==                  → <span class="foreign-text">
 *   [^id] footnote refs          → dropped (the notes belong to the
 *                                  translation below; a bare number here
 *                                  would point nowhere)
 *   [text](url) links            → their text only
 *   dialogue lines (— / – / "- ")→ line break before each turn
 *   blank line                   → paragraph gap
 *   other line breaks            → a space (soft wraps)
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

/**
 * Escape text for use as element content. Quotes stay literal: the output never
 * lands in an attribute, and the typography pass needs to see them.
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>]/g, ch => ESCAPES[ch]);
}

function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(/\[\^[^\]]+\]/g, '')
    .replace(/\[([^\]]+)\]\((?:[^()]*|\([^()]*\))*\)/g, '$1')
    .replace(/==([^=]+)==/g, '<span class="foreign-text">$1</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/(?<![\p{L}\p{N}])_([^_]+)_(?![\p{L}\p{N}])/gu, '<em>$1</em>')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function renderOriginalHtml(markdown: string): string {
  const blocks = markdown
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n+/)
    .map(block => block.trim())
    .filter(Boolean);

  return blocks
    .map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      let html = '';
      let atStart = true; // at block start or right after a heading line
      for (const line of lines) {
        const heading = line.match(/^#{1,4}\s+(.+)$/);
        if (heading) {
          html += `<span class="original-date-heading">${renderInline(heading[1])}</span>`;
          atStart = true;
          continue;
        }
        const isDialogue = /^[—–]/.test(line) || /^-\s/.test(line);
        html += (atStart ? '' : isDialogue ? '<br>' : ' ') + renderInline(line);
        atStart = false;
      }
      return html;
    })
    .join('<br><br>');
}
