import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ALSO_TOUCHED_PREFIX,
  buildResultsRows,
  findUnfilledStubs,
  formatStubRefusal,
  generateReportStub,
  isForceRequested,
  isUnfilledStub,
  renderReportStub,
  type StubInput,
} from './report.js';

// Regression for the duplicated-row bug in the session-end draft reports
// (2026-09-05..07 stubs carried each carnet 3-5x, once per language touched).
describe('buildResultsRows', () => {
  const count = (lang: string, carnet: string) => `${lang}/${carnet}`.length;

  it('emits each carnet of the primary language exactly once, sorted', () => {
    const rows = buildResultsRows('cz', ['092', '085', '092', '088'], count);
    expect(rows).toEqual([
      '| 085 | 6 | — | — | — |',
      '| 088 | 6 | — | — | — |',
      '| 092 | 6 | — | — | — |',
    ]);
  });

  it('counts entries in the primary tree only, never a sibling language', () => {
    const seen: string[] = [];
    buildResultsRows('uk', ['001'], (lang, carnet) => {
      seen.push(`${lang}/${carnet}`);
      return 0;
    });
    expect(seen).toEqual(['uk/001']);
  });

  it('returns no rows for an empty carnet list', () => {
    expect(buildResultsRows('en', [], count)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Unfilled-stub gate (teamcouch 2026-09-07: four skeletons piled up unfilled,
// one for three weeks, because every session wrote a fresh one).
// ---------------------------------------------------------------------------

const input: StubInput = {
  date: '2026-09-07',
  operator: '@kerray',
  durationMinutes: 42,
  lang: 'cz',
  carnets: ['018', '095'],
  pipeline: ['translator', 'editor'],
  skillVersions: { translator: 'abc1234', editor: 'def5678' },
  countEntries: () => 3,
};

/** A stub as the hook writes it, i.e. unfilled. */
const freshStub = (lang: string, carnets: string[]) =>
  renderReportStub({ ...input, lang, carnets });

/** The same stub after the operator filled it in. */
const filledReport = (status: 'final' | 'reviewed') =>
  freshStub('uk', ['001'])
    .replace('status: draft', `status: ${status}`)
    .replace(/\(fill in\)/g, 'Fable 5.1')
    .replace(/\(Fill in:[^)]*\)/g, 'All agents completed normally.');

describe('isUnfilledStub', () => {
  it('detects a freshly generated stub', () => {
    expect(isUnfilledStub(freshStub('cz', ['001']))).toBe(true);
  });

  it('ignores a filled report with status final or reviewed', () => {
    expect(isUnfilledStub(filledReport('final'))).toBe(false);
    expect(isUnfilledStub(filledReport('reviewed'))).toBe(false);
  });

  it('ignores a draft whose sections were written but status not flipped', () => {
    const written = filledReport('final').replace('status: final', 'status: draft');
    expect(isUnfilledStub(written)).toBe(false);
  });

  it('ignores files without frontmatter', () => {
    expect(isUnfilledStub('# Notes\n\n(fill in)\n')).toBe(false);
  });
});

describe('isForceRequested', () => {
  it('accepts 1/true/yes and nothing else', () => {
    expect(isForceRequested({ REPORT_HOOK_FORCE: '1' })).toBe(true);
    expect(isForceRequested({ REPORT_HOOK_FORCE: 'true' })).toBe(true);
    expect(isForceRequested({ REPORT_HOOK_FORCE: 'YES' })).toBe(true);
    expect(isForceRequested({ REPORT_HOOK_FORCE: '0' })).toBe(false);
    expect(isForceRequested({})).toBe(false);
  });
});

describe('generateReportStub gate', () => {
  let dir: string;
  const gather = async () => input;
  const mdFiles = () => readdirSync(dir).filter((f) => f.endsWith('.md')).sort();

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'reports-'));
    writeFileSync(join(dir, 'README.md'), '---\nstatus: draft\n---\n(fill in)\n');
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('refuses while an unfilled stub exists, names it, and notes the new scope inside it', async () => {
    writeFileSync(join(dir, '2026-08-14-cz-002-106.md'), freshStub('cz', ['002', '106']));
    writeFileSync(join(dir, '2026-07-10-uk-000-106.md'), freshStub('uk', ['000', '106']));

    const outcome = await generateReportStub({ reportsDir: dir, force: false, gather });

    expect(outcome.kind).toBe('refused');
    if (outcome.kind !== 'refused') return;
    // newest first, README.md never counted
    expect(outcome.unfilled).toEqual(['2026-08-14-cz-002-106.md', '2026-07-10-uk-000-106.md']);
    expect(outcome.notedIn).toBe('2026-08-14-cz-002-106.md');
    expect(outcome.summary).toBe('cz 018, 095');
    // no new stub written
    expect(mdFiles()).toEqual(['2026-07-10-uk-000-106.md', '2026-08-14-cz-002-106.md', 'README.md']);
    // scope of the refused session survives in the newest unfilled stub
    const noted = readFileSync(join(dir, '2026-08-14-cz-002-106.md'), 'utf-8');
    expect(noted).toContain(`${ALSO_TOUCHED_PREFIX} (2026-09-07, session-end hook): cz 018, 095`);
    // the message points the operator at the file and the escape hatch
    const msg = formatStubRefusal(outcome.unfilled, outcome.notedIn, outcome.summary).join('\n');
    expect(msg).toContain('.claude/reports/2026-08-14-cz-002-106.md');
    expect(msg).toContain('REPORT_HOOK_FORCE=1');
  });

  it('appends the also-touched note only once across repeated Stop events', async () => {
    writeFileSync(join(dir, '2026-08-14-cz-002-106.md'), freshStub('cz', ['002', '106']));
    await generateReportStub({ reportsDir: dir, force: false, gather });
    const second = await generateReportStub({ reportsDir: dir, force: false, gather });
    expect(second.kind === 'refused' && second.notedIn).toBe(null);
    const text = readFileSync(join(dir, '2026-08-14-cz-002-106.md'), 'utf-8');
    expect(text.split(ALSO_TOUCHED_PREFIX).length - 1).toBe(1);
  });

  it('writes a stub when the only existing reports are filled (final/reviewed)', async () => {
    writeFileSync(join(dir, '2026-09-05-uk-001-106.md'), filledReport('final'));
    writeFileSync(join(dir, '2026-06-13-cz-083-092.md'), filledReport('reviewed'));

    const outcome = await generateReportStub({ reportsDir: dir, force: false, gather });

    expect(outcome).toEqual({ kind: 'written', filename: '2026-09-07-cz-018-095.md' });
    const written = readFileSync(join(dir, '2026-09-07-cz-018-095.md'), 'utf-8');
    expect(isUnfilledStub(written)).toBe(true);
    expect(written).toContain('| 018 | 3 | — | — | — |');
    expect(findUnfilledStubs(dir)).toEqual(['2026-09-07-cz-018-095.md']);
  });

  it('writes a stub despite an unfilled one when forced', async () => {
    writeFileSync(join(dir, '2026-08-14-cz-002-106.md'), freshStub('cz', ['002', '106']));

    const outcome = await generateReportStub({ reportsDir: dir, force: true, gather });

    expect(outcome).toEqual({ kind: 'written', filename: '2026-09-07-cz-018-095.md' });
    // the existing unfilled stub is left untouched — no also-touched note
    expect(readFileSync(join(dir, '2026-08-14-cz-002-106.md'), 'utf-8')).not.toContain(ALSO_TOUCHED_PREFIX);
  });

  it('writes nothing when the session touched no content', async () => {
    const outcome = await generateReportStub({ reportsDir: dir, force: false, gather: async () => null });
    expect(outcome).toEqual({ kind: 'none' });
    expect(mdFiles()).toEqual(['README.md']);
  });
});
