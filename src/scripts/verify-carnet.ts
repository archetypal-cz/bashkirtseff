#!/usr/bin/env -S npx tsx
/**
 * verify-carnet — mechanical pre-RED structural integrity gate for a translated carnet.
 *
 * Catches the class of defect that a reading review reliably misses (frontmatter
 * stripping, glossary path-depth drift, broken links, orphaned/duplicate footnotes,
 * unbalanced %% markers, script contamination). NOT a quality/accuracy linter — that
 * stays with RED/CON.
 *
 * Usage:
 *   npx tsx src/scripts/verify-carnet.ts <lang> <carnet> [--strict] [--quiet]
 *   just verify-carnet uk 062
 *
 * Exit code: 0 on PASS (warnings allowed), 1 if any FAIL-severity check trips.
 * --strict promotes WARN -> FAIL. --quiet prints only failures + the result line.
 *
 * See docs/VERIFY_CARNET_GATE.md for the design.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Finding {
  check: string;
  severity: 'FAIL' | 'WARN';
  file: string;
  line?: number;
  message: string;
}

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const positional = args.filter((a) => !a.startsWith('--'));
const [lang, carnet] = positional;
const STRICT = flags.has('--strict');
const QUIET = flags.has('--quiet');

const KNOWN_FLAGS = new Set(['--strict', '--quiet']);
const unknownFlags = [...flags].filter((f) => !KNOWN_FLAGS.has(f));
if (!lang || !carnet || unknownFlags.length > 0 || positional.length > 2) {
  const bad = [...unknownFlags, ...positional.slice(2)];
  if (bad.length) console.error(`Unknown/extra argument(s): ${bad.join(' ')}`);
  console.error('Usage: verify-carnet <lang> <carnet> [--strict] [--quiet]');
  process.exit(2);
}

const projectRoot = path.resolve(__dirname, '..', '..');
const dir = path.join(projectRoot, 'content', lang, carnet);
if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
  console.error(`No such directory: content/${lang}/${carnet}`);
  process.exit(2);
}

const isTranslation = lang !== '_original';
const CYRILLIC_LANGS = new Set(['uk', 'ru', 'bg', 'sr', 'be']);
const checkScripts = CYRILLIC_LANGS.has(lang);

const findings: Finding[] = [];
const add = (f: Finding) => findings.push(f);

const entryFiles = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.md') && f !== 'README.md' && f !== 'PROGRESS.md')
  .sort();

// An empty carnet must not silently PASS — there is nothing to verify.
if (entryFiles.length === 0) {
  console.error(`No entry .md files to verify in content/${lang}/${carnet}`);
  process.exit(2);
}

// --- helpers -------------------------------------------------------------

function splitFrontmatter(text: string): { fm: string | null; bodyStartLine: number } {
  const lines = text.split('\n');
  if (lines[0].trim() !== '---') return { fm: null, bodyStartLine: 0 };
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return { fm: lines.slice(1, i).join('\n'), bodyStartLine: i + 1 };
    }
  }
  return { fm: null, bodyStartLine: 0 }; // unterminated frontmatter
}

// Strip spans that legitimately contain foreign script, so the contamination
// heuristics don't false-positive on deliberate code-switches / markup / links.
function stripBenignSpans(s: string): string {
  return s
    .replace(/==[^=]+==/g, ' ') // deliberate ==code-switch== highlights
    .replace(/\]\([^)]*\)/g, ' ') // markdown link targets
    .replace(/\[\^[^\]]+\]/g, ' ') // footnote refs/defs labels
    .replace(/`[^`]*`/g, ' '); // inline code
}

// --- per-file checks -----------------------------------------------------

for (const fname of entryFiles) {
  const fpath = path.join(dir, fname);
  const text = fs.readFileSync(fpath, 'utf8');
  const lines = text.split('\n');
  const { fm, bodyStartLine } = splitFrontmatter(text);

  // 1. Frontmatter present + required keys (FAIL)
  if (fm === null) {
    add({ check: 'frontmatter', severity: 'FAIL', file: fname, message: 'missing or unterminated YAML frontmatter (no leading --- block)' });
  } else {
    for (const key of ['date', 'carnet', 'translation_complete']) {
      if (isTranslation && !new RegExp(`^${key}:`, 'm').test(fm)) {
        add({ check: 'frontmatter', severity: 'FAIL', file: fname, message: `frontmatter missing required key: ${key}` });
      }
    }
  }

  // 2 & 3. Links + glossary path-depth
  lines.forEach((line, idx) => {
    const ln = idx + 1;
    const linkRe = /\]\(([^)]+\.md[^)]*)\)/g;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(line)) !== null) {
      let target = m[1].split('#')[0];
      if (/^(https?:|mailto:)/.test(target)) continue;
      // 3. path-depth: translations must reach the source glossary via ../../_original/
      if (isTranslation && target.includes('../_glossary/') && !target.includes('../../_original/_glossary/')) {
        add({ check: 'glossary-depth', severity: 'FAIL', file: fname, line: ln, message: `short glossary path "${target}" (should be ../../_original/_glossary/…)` });
      }
      // 2. resolution
      if (!fs.existsSync(path.join(path.dirname(fpath), target))) {
        add({ check: 'links', severity: 'FAIL', file: fname, line: ln, message: `unresolved link -> ${target}` });
      }
    }
  });

  // 4. Footnote integrity: refs vs defs, no duplicate defs
  const defLabels = new Map<string, number>();
  const refLabels = new Set<string>();
  lines.forEach((line) => {
    // A definition is a LINE-START `[^id]:` (the colon is required Markdown syntax).
    const defM = line.match(/^\s*\[\^([^\]]+)\]:/);
    let scan = line;
    if (defM) {
      defLabels.set(defM[1], (defLabels.get(defM[1]) || 0) + 1);
      scan = line.replace(/^\s*\[\^[^\]]+\]:/, ''); // strip the def marker; remainder may still hold refs
    }
    // Everything else (incl. a mid-prose `[^id]:` followed by a real colon) is a reference.
    const refRe = /\[\^([^\]]+)\]/g;
    let rm: RegExpExecArray | null;
    while ((rm = refRe.exec(scan)) !== null) refLabels.add(rm[1]);
  });
  for (const [label, count] of defLabels) {
    if (count > 1) add({ check: 'footnotes', severity: 'FAIL', file: fname, message: `duplicate footnote definition [^${label}] (${count}×)` });
    if (!refLabels.has(label)) add({ check: 'footnotes', severity: 'FAIL', file: fname, message: `footnote definition [^${label}] has no in-text reference` });
  }
  for (const label of refLabels) {
    if (!defLabels.has(label)) add({ check: 'footnotes', severity: 'FAIL', file: fname, message: `footnote reference [^${label}] has no definition` });
  }

  // 5. Balanced %% markers (even count)
  const pct = (text.match(/%%/g) || []).length;
  if (pct % 2 !== 0) {
    add({ check: '%%-balance', severity: 'FAIL', file: fname, message: `odd number of %% markers (${pct}) — an unterminated comment/source block` });
  }

  // 6 & 7. Script contamination — only on translation BODY lines (skip %% blocks & frontmatter)
  if (checkScripts) {
    for (let i = bodyStartLine; i < lines.length; i++) {
      const raw = lines[i];
      if (raw.trim().startsWith('%%')) continue; // skip annotation/source lines (project uses single-line %% … %% blocks)
      const s = stripBenignSpans(raw);
      // 6. Latin-in-Cyrillic: a token containing BOTH Cyrillic and Latin letters
      const tokens = s.split(/[\s.,;:!?()«»"'—–\-…]+/);
      for (const t of tokens) {
        if (/[Ѐ-ӿ]/.test(t) && /[A-Za-z]/.test(t)) {
          add({ check: 'latin-in-cyr', severity: 'WARN', file: fname, line: i + 1, message: `mixed Cyrillic+Latin token: "${t}"` });
          break; // one per line is enough signal
        }
      }
      // 7. Stray CJK / other unexpected scripts
      if (/[　-鿿가-힯]/.test(s)) {
        add({ check: 'foreign-script', severity: 'WARN', file: fname, line: i + 1, message: `stray CJK/other-script character in body` });
      }
    }
  }
}

// --- report --------------------------------------------------------------

const CHECK_ORDER = ['frontmatter', 'links', 'glossary-depth', 'footnotes', '%%-balance', 'latin-in-cyr', 'foreign-script'];
const effSeverity = (f: Finding): 'FAIL' | 'WARN' => (STRICT && f.severity === 'WARN' ? 'FAIL' : f.severity);
const fails = findings.filter((f) => effSeverity(f) === 'FAIL');
const warns = findings.filter((f) => effSeverity(f) === 'WARN');

if (!QUIET) {
  console.log(`=== verify-carnet ${lang}/${carnet} (${entryFiles.length} files) ===`);
  for (const check of CHECK_ORDER) {
    const f = findings.filter((x) => x.check === check);
    if (f.length === 0) {
      console.log(`  ${check.padEnd(15)} OK`);
    } else {
      const sev = f.some((x) => effSeverity(x) === 'FAIL') ? 'FAIL' : 'WARN';
      console.log(`  ${check.padEnd(15)} ${sev} (${f.length})`);
    }
  }
}

const toPrint = QUIET ? fails : findings;
if (toPrint.length > 0) {
  if (!QUIET) console.log('');
  for (const f of toPrint.sort((a, b) => a.file.localeCompare(b.file) || (a.line || 0) - (b.line || 0))) {
    const loc = f.line ? `${f.file}:${f.line}` : f.file;
    console.log(`  [${effSeverity(f)}] ${f.check}  ${loc}  ${f.message}`);
  }
}

const result = fails.length === 0 ? 'PASS' : 'FAIL';
console.log(`RESULT: ${result} (${fails.length} fail, ${warns.length} warn)`);
process.exit(fails.length === 0 ? 0 : 1);
