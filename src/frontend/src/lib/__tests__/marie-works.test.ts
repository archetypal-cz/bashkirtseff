/**
 * getMarieWorks(): the hub gallery's data. Only entries flagged
 * `marie_work: true` appear, ordered by first year with undated works last,
 * and an unrecognised status reads as 'unknown'.
 *
 * Same throwaway-content-tree pattern as comment-markers.test.ts.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-works-'));
const contentRoot = path.join(tmpRoot, 'content');
const fakeCwd = path.join(tmpRoot, 'src', 'frontend');

let content: typeof import('../content');

function writeArt(id: string, frontmatter: string): void {
  const dir = path.join(contentRoot, '_original', '_glossary', 'culture', 'art');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${id}.md`), `---\nid: ${id}\n${frontmatter}\n---\n\nBody.\n`, 'utf-8');
}

beforeAll(async () => {
  writeArt('LATE', 'name: Late\nmarie_work: true\nwork:\n  year: "1884"\n  status: public\n  location: "Musée d\'Orsay, Paris"');
  writeArt('EARLY', 'name: Early\nmarie_work: true\nwork:\n  year: "c. 1878"\n  status: private');
  writeArt('UNDATED', 'name: Undated\nmarie_work: true\nwork:\n  status: misspelt');
  writeArt('NOT_HERS', 'name: Salon\nwork:\n  year: "1880"\n  status: public');

  fs.mkdirSync(fakeCwd, { recursive: true });
  vi.spyOn(process, 'cwd').mockReturnValue(fakeCwd);
  content = await import('../content');
});

afterAll(() => {
  vi.restoreAllMocks();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('getMarieWorks', () => {
  it('lists only flagged entries, by first year, undated last', () => {
    expect(content.getMarieWorks('original').map(e => e.id)).toEqual(['EARLY', 'LATE', 'UNDATED']);
  });

  it('keeps the catalogue data and normalizes an unknown status', () => {
    const works = Object.fromEntries(content.getMarieWorks('cz').map(e => [e.id, e.work]));
    expect(works.LATE).toEqual({ year: '1884', medium: undefined, status: 'public', location: "Musée d'Orsay, Paris" });
    expect(works.UNDATED?.status).toBe('unknown');
  });
});
