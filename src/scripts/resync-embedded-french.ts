// Restore the embedded French copy (%% lines under each paragraph ID) in translation
// files from content/_original, leaving every other line untouched. Used for the
// 2026-09-26 resync (commits 579bc73ca…551dbbe27). Skips: embeds interleaved with
// visible lines, fr multi-line %% blocks, misaligned paragraphs — reported instead.
// Usage: npx tsx src/scripts/resync-embedded-french.ts <targets-file> <gap-report-out> [--write]
//   targets-file: one "<lang> <carnet>" per line. Dry run unless --write.
// Always follow with `just sync-verify <carnet> <lang>` before committing.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ParagraphParser } from '../shared/src/parser/paragraph-parser.ts';
import { renderSourceComment } from '../shared/src/renderer/paragraph-renderer.ts';

const write = process.argv.includes('--write');
const targets = fs.readFileSync(process.argv[2], 'utf-8').trim().split('\n').map(l => l.trim().split(/\s+/));
const gapOut = process.argv[3];
const gaps: string[] = [];
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../content');
const P = new ParagraphParser();
const norm = (s: string) => s.replace(/^#+ /gm, '').replace(/ \/ /g, ' ').replace(/\[\^[^\]]+\]/g, '').replace(/[’‘ʼ]/g, "'").replace(/[“”«»]/g, '"').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const ID = /^%% (\d{3})\.(\d{4}) %%\s*$/;
const isSourceLine = (l: string) => {
  const m = l.match(/^%% (.*?)\s*%%\s*$/);
  if (!m) return false;
  const b = m[1];
  if (b.includes('%%')) return false;
  if (/^\d{3}\.\d{4}$/.test(b) || /^\[#/.test(b)) return false;
  if (/^\d{4}-\d{2}-\d{2}/.test(b) || /^[A-Z]{2,4}( [A-Za-z ]+)?:/.test(b)) return false;
  if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})? [A-Z]{2,4}:/.test(b)) return false;
  return true;
};
// embeds that are correct French where _original itself has a typo — leave for a source fix
const FORCE = new Set(['059.0076', '008.0197', '094.0003', '105.0203']);
const KEEP = new Set(['053.0015', '053.0409', '094.0050', '092.0237', '092.0246', '105.0085']);
const shingleCover = (a: string, b: string) => { const fa = fold(a), fb = fold(b); if (fa.length < 10) return 0; let hit = 0, n = 0; for (let i = 0; i + 6 <= fa.length; i += 3) { n++; if (fb.includes(fa.slice(i, i + 6))) hit++; } return hit / n; };
for (const [lang, carnet] of targets) {
const stats: Record<string, number> = {};
const bump = (k: string) => (stats[k] = (stats[k] || 0) + 1);
const skipped: string[] = [];
const changedFiles: string[] = [];
const dir = path.join(root, lang, carnet);
const EXCL = new Set((process.env.EXCLUDE || '').split(',').filter(Boolean));
for (const f of fs.readdirSync(dir).filter(f => /^\d.*\.md$/.test(f) && !EXCL.has(f)).sort()) {
  const tf = path.join(dir, f), of = path.join(root, '_original', carnet, f);
  if (!fs.existsSync(of)) continue;
  const o = P.parseFile(of), t = P.parseFile(tf);
  const tm = new Map(t.paragraphs.map(x => [x.id, x]));
  const need = new Map<string, string[]>();
  const meta = new Map<string, any>();
  for (const op of o.paragraphs) {
    const src = renderSourceComment(op.originalText || '').filter(l => !l.startsWith('%% [//]:'));
    if (!src.length) continue;
    const tp = tm.get(op.id);
    if (!tp) { bump('absentId'); continue; }
    const ot = norm(op.originalText || ''), tt = norm(tp.originalText || '');
    const otBody = norm((op.originalText || '').replace(/^#+ [^\n]*\n+/, ''));
    if (ot === tt || (tt && otBody === tt) || (tt && ot.toLowerCase() === tt.toLowerCase())) continue;
    if (op.isHeader && !tt) { bump('headerSkip'); continue; }
    let kind: string;
    const tb = tt.replace(/(…|\.\.\.)$/, '').trim();
    if (!tt) kind = 'missing';
    else if (fold(ot) === fold(tt) || fold(otBody) === fold(tt)) kind = 'cosmetic';
    else if (fold(tb) && fold(ot).includes(fold(tb))) kind = /(…|\.\.\.)$/.test(tt) ? 'trunc' : 'partial';
    else if (process.env.SHOWDIFF && !op.id.startsWith("header_") && !KEEP.has(op.id)) { kind = "differ"; console.log(`  DIFF ${f} ${op.id} | T=${tt.slice(0, 110)} | O=${ot.slice(0, 110)}`); }
    else if (FORCE.has(op.id) || !op.id.startsWith('header_') && !KEEP.has(op.id) && (
      !fold(tt) || fold(ot).includes(fold(tt).slice(0, 25)) || fold(tt).includes(fold(ot).slice(0, 25)) ||
      (tt.length < 60 && /18[78]\d/.test(tt)) || /^\[continu/i.test(tt) || shingleCover(tt, ot) >= 0.7)) kind = 'differ';
    else { bump('differSkip'); skipped.push(`${f} ${op.id} | T=${tt.slice(0, 90)} | O=${ot.slice(0, 90)}`); continue; }
    const vis = norm(tp.translatedText || '');
    const r = vis.length / Math.max(1, otBody.length || ot.length);
    if ((kind === 'missing' || kind === 'differ') && Math.max(vis.length, ot.length) > 80 && (r < 0.4 || r > 2.5)) {
      bump('ratioSkip'); skipped.push(`${f} ${op.id} ${kind} ratio=${r.toFixed(2)} | V=${vis.slice(0, 70)} | O=${ot.slice(0, 70)}`); continue;
    }
    bump(kind);
    need.set(op.id, src);
    meta.set(op.id, { kind, old: tp.originalText || '', neu: op.originalText || '', vis: tp.translatedText || '', ot, otBody });
  }
  if (!need.size) continue;
  const lines = fs.readFileSync(tf, 'utf-8').split('\n');
  const out: string[] = [];
  const odd = (l: string) => ((l.match(/%%/g) || []).length % 2) === 1;
  const openAt: boolean[] = []; { let open = false; for (const l of lines) { openAt.push(open); if (odd(l)) open = !open; } }
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(ID);
    if (!m || !need.has(`${m[1]}.${m[2]}`)) { out.push(lines[i++]); continue; }
    const src = need.get(`${m[1]}.${m[2]}`)!;
    out.push(lines[i++]);
    let end = i;
    while (end < lines.length && !ID.test(lines[end])) end++;
    const block = lines.slice(i, end);
    const s = block.findIndex(isSourceLine);
    let nb: string[];
    // only treat as existing embed if it precedes the first visible text line
    const firstText = block.findIndex(l => l.trim() !== '' && !l.startsWith('%%') && !l.startsWith('[^'));
    const id = `${m[1]}.${m[2]}`, md = meta.get(id);
    if (openAt[i - 1] || block.some(odd)) { bump('unbalancedSkip'); need.delete(id); skipped.push(`UNBALANCED ${f} ${id}`); out.push(...block); i = end; continue; }
    const lim = firstText < 0 ? block.length : firstText;
    const pre = block.slice(0, lim).map((l, k) => [l, k] as [string, number]).filter(([l]) => isSourceLine(l));
    const whole = norm(pre.map(([l]) => l.replace(/^%% /, '').replace(/\s*%%\s*$/, '')).join('\n'));
    const post = block.slice(lim).filter(isSourceLine);
    if (firstText >= 0 && post.length) {
      bump('lineInterleavedSkip'); need.delete(id); nb = block;
      const all = norm(block.filter(isSourceLine).map(l => l.replace(/^%% /, '').replace(/\s*%%\s*$/, '')).join('\n'));
      if (fold(all) !== fold(md.ot) && fold(all) !== fold(md.otBody)) skipped.push(`LINEINTERLEAVED-DIFF ${f} ${id} | T=${all.slice(0, 90)} | O=${md.ot.slice(0, 90)}`);
    } else
    if (s >= 0 && s < lim && pre.length > 1 && (whole === md.ot || whole === md.otBody || whole.toLowerCase() === md.ot.toLowerCase())) {
      bump('interleavedOK'); need.delete(id); nb = block;
    } else if (s >= 0 && s < lim) {
      const drop = new Set(pre.map(([, k]) => k));
      nb = [...block.slice(0, s), ...src, ...block.slice(s).filter((_, k) => !drop.has(k + s))];
      gaps.push(JSON.stringify({ lang, carnet, f, id, ...md, old: pre.length > 1 ? pre.map(([l]) => l.replace(/^%% /, '').replace(/\s*%%\s*$/, '')).join('\n') : md.old }));
    } else if (firstText >= 0) {
      nb = [...block.slice(0, firstText), ...src, ...block.slice(firstText)];
      gaps.push(JSON.stringify({ lang, carnet, f, id, ...md }));
    } else { bump('noTextSkip'); skipped.push(`${f} ${m[1]}.${m[2]} no visible text`); nb = block; }
    out.push(...nb);
    i = end;
  }
  const res = out.join('\n');
  if (write) fs.writeFileSync(tf, res);
  changedFiles.push(f);
  // post-check: re-parse and confirm
  if (write) {
    const t2 = P.parseFile(tf); const m2 = new Map(t2.paragraphs.map(x => [x.id, x]));
    for (const [id, src] of need) {
      const got = m2.get(id)?.originalText || '';
      if (renderSourceComment(got).join('\n') !== src.join('\n')) { bump('POSTCHECK_FAIL'); skipped.push(`POSTCHECK ${f} ${id}`); }
    }
  }
}
console.log(`${lang}/${carnet} ${write ? 'WROTE' : 'DRY'} files=${changedFiles.length}`, JSON.stringify(stats));
for (const s of skipped) console.log('  SKIP', s);
}
if (gapOut) fs.writeFileSync(gapOut, gaps.join('\n') + '\n');
