#!/usr/bin/env -S npx tsx
/**
 * renumber-audit — find paragraph_reports rows that still point at pre-renumber paragraph IDs and (optionally)
 * write a fix-up migration. OFFLINE and OWNER-RUN ONLY: never run it in CI (the repo is public; the CSV holds reader text).
 *
 * Usage:
 *   just renumber-audit --reports reports.csv [--write-migration] [--date YYYY-MM-DD] [--head REF]
 *                       [--root DIR] [--out-dir DIR] [--migrations-dir DIR]
 *
 * Writes docs/research/renumber-audit-<date>.md (UUIDs, paragraph IDs, verdicts, counts; no reader text) and, with
 * --write-migration, src/auth/migrations/NNNN-legacy-report-fixups.sql for the NOT_APPLIED rows.
 * Procedure and verdict meanings: docs/DB_DEPLOY.md, "Before merge: fix stale reports".
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { auditAll, countVerdicts, Git, parseReports, renderMigration, renderReport } from './lib/renumber-audit-core.ts';

function die(msg: string): never {
  console.error(`renumber-audit: ${msg}`);
  process.exit(1);
}

function main(argv: string[]) {
  const opt: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--write-migration') opt.writeMigration = true;
    else if (['--reports', '--date', '--head', '--root', '--out-dir', '--migrations-dir'].includes(a)) {
      if (i + 1 >= argv.length) die(`${a} needs a value`);
      opt[a.slice(2)] = argv[++i];
    } else die(`unknown argument: ${a}`);
  }
  if (!opt.reports) die('usage: renumber-audit --reports <csv> [--write-migration] (see docs/DB_DEPLOY.md)');
  const csvPath = path.resolve(process.env.INVOCATION_DIR || process.cwd(), String(opt.reports));
  if (!fs.existsSync(csvPath)) die(`reports file not found: ${csvPath}`);
  let rows;
  try { rows = parseReports(fs.readFileSync(csvPath, 'utf8')); } catch (e) { die((e as Error).message); }

  const root = String(opt.root ?? spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).stdout.trim());
  if (!root) die('not inside a git repository (use --root)');
  const git = new Git(root);
  if (git.run(['rev-parse', '--is-shallow-repository']).out.trim() === 'true') die('shallow checkout: the audit needs the full history (git fetch --unshallow)');
  const headRef = String(opt.head ?? 'HEAD');
  const head = git.resolve(headRef);
  const date = String(opt.date ?? new Date().toISOString().slice(0, 10));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) die('--date must be YYYY-MM-DD');

  const { results, layers } = auditAll(git, head, rows);
  const meta = { date, head };
  const outDir = path.resolve(String(opt['out-dir'] ?? path.join(root, 'docs', 'research')));
  fs.mkdirSync(outDir, { recursive: true });
  const reportFile = path.join(outDir, `renumber-audit-${date}.md`);
  fs.writeFileSync(reportFile, renderReport(results, layers, meta));
  const c = countVerdicts(results);
  console.log(`reports audited: ${results.length}  UNAFFECTED ${c.UNAFFECTED}  APPLIED ${c.APPLIED}  NOT_APPLIED ${c.NOT_APPLIED}  AMBIGUOUS ${c.AMBIGUOUS}`);
  console.log(`report: ${reportFile}`);

  if (opt.writeMigration) {
    const fix = results.filter((r) => r.verdict === 'NOT_APPLIED' && r.fixup);
    if (!fix.length) { console.log('no NOT_APPLIED rows: no migration written'); return; }
    const migDir = path.resolve(String(opt['migrations-dir'] ?? path.join(root, 'src', 'auth', 'migrations')));
    fs.mkdirSync(migDir, { recursive: true });
    const nums = fs.readdirSync(migDir).map((f) => /^(\d{4})-.*\.sql$/.exec(f)).filter(Boolean).map((m) => Number(m![1]));
    const next = String(Math.max(0, ...nums) + 1).padStart(4, '0');
    const file = path.join(migDir, `${next}-legacy-report-fixups.sql`);
    fs.writeFileSync(file, renderMigration(results, meta), { flag: 'wx' });
    console.log(`migration: ${file} (${fix.length} rows). Next: bash src/auth/db-deploy.sh lint migration <file>, review, commit.`);
  }
}

main(process.argv.slice(2));
