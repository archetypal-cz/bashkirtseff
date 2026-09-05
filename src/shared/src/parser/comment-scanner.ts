/**
 * Scanner for Obsidian-style `%% ... %%` comment blocks.
 *
 * A single line may carry several blocks; a block whose opening `%%` is not
 * closed on the same line continues until the next line that ENDS with `%%`.
 * A `%%` appearing mid-line inside an open block is literal note text.
 */

export interface CommentSegment {
  /** Inner text, trimmed; multi-line blocks keep their newlines */
  content: string;
  startLine: number;
  endLine: number;
}

export interface ScannedLine {
  raw: string;
  /** Comment blocks opening on this line (multi-line blocks included) */
  comments: CommentSegment[];
  /** Text outside the comment blocks on this line */
  outsideText: string;
  /** The line holds comment blocks and nothing else */
  isCommentOnly: boolean;
  /** The line is part of a multi-line block opened on an earlier line */
  consumed: boolean;
}

export interface CommentScanResult {
  lines: ScannedLine[];
  warnings: string[];
}

interface TailScan {
  segments: string[];
  text: string;
  /** Index just past an unclosed `%%`, or null */
  unclosedAt: number | null;
}

function scanTail(line: string, from: number): TailScan {
  const segments: string[] = [];
  let text = '';
  let pos = from;

  for (;;) {
    const open = line.indexOf('%%', pos);
    if (open === -1) {
      text += line.slice(pos);
      return { segments, text, unclosedAt: null };
    }
    text += line.slice(pos, open);

    const close = line.indexOf('%%', open + 2);
    if (close === -1) {
      return { segments, text, unclosedAt: open + 2 };
    }

    segments.push(line.slice(open + 2, close));
    pos = close + 2;
  }
}

export function scanComments(lines: string[]): CommentScanResult {
  const out: ScannedLine[] = lines.map((raw) => ({
    raw,
    comments: [],
    outsideText: raw,
    isCommentOnly: false,
    consumed: false,
  }));
  const warnings: string[] = [];

  let i = 0;
  while (i < lines.length) {
    if (out[i].consumed) {
      i++;
      continue;
    }

    const trimmed = lines[i].trim();
    const head = scanTail(lines[i], 0);
    let comments: CommentSegment[] = head.segments.map((s) => ({
      content: s.trim(),
      startLine: i,
      endLine: i,
    }));
    let text = head.text;
    let last = i;

    // A line wrapped in `%%` whose prose contains further `%%` markers splits
    // into pieces that leave stray text behind. Keep it as one comment.
    const strayText = head.text.trim() !== '' || head.unclosedAt !== null;
    if (strayText && trimmed.length >= 4 && trimmed.startsWith('%%') && trimmed.endsWith('%%')) {
      warnings.push(`Uneven %% markers on line ${i + 1}; read as a single comment`);
      out[i].comments = [{ content: trimmed.slice(2, -2).trim(), startLine: i, endLine: i }];
      out[i].outsideText = '';
      out[i].isCommentOnly = true;
      i++;
      continue;
    }

    if (head.unclosedAt !== null) {
      // A block may only span lines when nothing but whitespace precedes it,
      // otherwise the line is ordinary text that happens to contain `%%`.
      if (text.trim() !== '') {
        warnings.push(`Unbalanced %% on line ${i + 1}`);
        text += lines[i].slice(head.unclosedAt - 2);
      } else {
        const buffer = [lines[i].slice(head.unclosedAt)];
        let j = i + 1;
        let closeAt = -1;
        while (j < lines.length) {
          // Inside an open block only a line ENDING in `%%` closes it; a `%%`
          // in the middle of a continuation line is literal note text. This
          // matches src/scripts/check_comment_structure.py and the harvest tool.
          const trimmedEnd = lines[j].trimEnd();
          if (trimmedEnd.endsWith('%%')) {
            closeAt = trimmedEnd.length - 2;
            break;
          }
          buffer.push(lines[j]);
          j++;
        }

        if (closeAt === -1) {
          warnings.push(`Unbalanced %% opened on line ${i + 1}`);
          text += lines[i].slice(head.unclosedAt - 2);
        } else {
          buffer.push(lines[j].slice(0, closeAt));
          comments.push({ content: buffer.join('\n').trim(), startLine: i, endLine: j });
          for (let k = i + 1; k <= j; k++) {
            out[k].consumed = true;
            out[k].outsideText = '';
          }

          const tail = scanTail(lines[j], closeAt + 2);
          for (const s of tail.segments) {
            comments.push({ content: s.trim(), startLine: j, endLine: j });
          }
          text += tail.text;
          if (tail.unclosedAt !== null) {
            warnings.push(`Unbalanced %% on line ${j + 1}`);
            text += lines[j].slice(tail.unclosedAt - 2);
          }
          last = j;
        }
      }
    }

    out[i].comments = comments;
    out[i].outsideText = text;
    out[i].isCommentOnly = comments.length > 0 && text.trim() === '';
    i = last + 1;
  }

  return { lines: out, warnings };
}
